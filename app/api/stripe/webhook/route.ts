import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Find the payment request by payment link ID
        const { data: paymentRequest, error: findError } = await supabase
          .from('payment_requests')
          .select('id, recipient_id, amount, payout_amount, description')
          .eq('stripe_payment_link_id', session.payment_link)
          .single();

        let finalPaymentRequest = paymentRequest;

        if (findError || !paymentRequest) {
          // Try to find by URL if payment_link ID doesn't work
          if (session.url) {
            const { data: fallbackRequest } = await supabase
              .from('payment_requests')
              .select('id, recipient_id, amount, payout_amount, description')
              .eq('payment_link_url', session.url)
              .single();

            if (fallbackRequest) {
              finalPaymentRequest = fallbackRequest;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // Update payment request status
        const { error: updateError } = await supabase
          .from('payment_requests')
          .update({
            status: 'paid',
            stripe_session_id: session.id,
            paid_by_email: session.customer_details?.email || null,
            paid_at: new Date().toISOString(),
          })
          .eq('id', finalPaymentRequest.id);

        if (updateError) {
          return new Response(`Database update error: ${updateError.message}`, { status: 500 });
        } else {

          // Trigger PayPal payout
          try {
            // Import and call payout function directly
            const { createPayout } = await import('@/lib/paypal');

            // Get recipient's PayPal email
            const { data: profile } = await supabase
              .from('profiles')
              .select('paypal_email, display_name')
              .eq('id', finalPaymentRequest.recipient_id)
              .single();

            if (!profile?.paypal_email) {
              return;
            }

            // Import platform configuration
            const { calculatePlatformFee, getPlatformConfig } = await import('@/lib/platform-config');

            // Calculate platform fee and recipient payout
            const totalAmount = finalPaymentRequest.amount;
            const { platformFeeCents, payoutAmountCents } = calculatePlatformFee(totalAmount);
            const platformConfig = getPlatformConfig();

            if (payoutAmountCents <= 0) {
              return;
            }

            // Update payment request with fee calculation and processing status
            await supabase
              .from('payment_requests')
              .update({
                payout_status: 'processing',
                platform_fee: platformFeeCents,
                payout_amount: payoutAmountCents
              })
              .eq('id', finalPaymentRequest.id);

            // Create PayPal payout to recipient
            const recipientPayoutResult = await createPayout({
              recipientEmail: profile.paypal_email,
              amount: payoutAmountCents,
              note: `Payment for: ${finalPaymentRequest.description || 'QR Code Payment'}`,
            });

            // Create PayPal payout to platform (if fee > 0)
            let platformPayoutResult = null;
            if (platformFeeCents > 0) {
              platformPayoutResult = await createPayout({
                recipientEmail: platformConfig.hostEmail,
                amount: platformFeeCents,
                note: `Platform fee (20%) for: ${finalPaymentRequest.description || 'QR Code Payment'}`,
              });
            }

            // Check if both payouts succeeded (or only recipient if no platform fee)
            const recipientSuccess = recipientPayoutResult.success;
            const platformSuccess = platformFeeCents > 0 ? (platformPayoutResult?.success || false) : true;

            if (recipientSuccess && platformSuccess) {
              // Both payouts succeeded
              await supabase
                .from('payment_requests')
                .update({
                  payout_status: 'completed',
                  payout_id: recipientPayoutResult.payoutBatchId,
                  payout_completed_at: new Date().toISOString(),
                })
                .eq('id', finalPaymentRequest.id);
            } else {
              // One or both payouts failed
              let errorMessage = '';
              if (!recipientSuccess) {
                errorMessage += `Recipient payout failed: ${recipientPayoutResult.error}`;
              }
              if (platformFeeCents > 0 && !platformSuccess) {
                if (errorMessage) errorMessage += ' | ';
                errorMessage += `Platform payout failed: ${platformPayoutResult?.error}`;
              }

              await supabase
                .from('payment_requests')
                .update({
                  payout_status: 'failed',
                  payout_error: errorMessage,
                })
                .eq('id', finalPaymentRequest.id);
            }
          } catch (payoutError) {

            // Update payout status to failed
            await supabase
              .from('payment_requests')
              .update({
                payout_status: 'failed',
                payout_error: payoutError instanceof Error ? payoutError.message : 'Unknown error',
              })
              .eq('id', finalPaymentRequest.id);
          }
        }

        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        // Update user's onboarding status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_onboarding_complete: !!(account.charges_enabled && account.payouts_enabled)
          })
          .eq('stripe_account_id', account.id);

        if (updateError) {
          console.error('Error updating onboarding status:', updateError);
        }

        console.log('Account updated:', account.id, 'Charges enabled:', account.charges_enabled);
        break;
      }

      case 'payment_link.created': {
        const paymentLink = event.data.object as Stripe.PaymentLink;
        console.log('Payment link created:', paymentLink.id);
        break;
      }

      case 'payment_link.updated': {
        const paymentLink = event.data.object as Stripe.PaymentLink;

        // Check if payment link is deactivated
        if (!paymentLink.active) {
          // Mark corresponding payment request as expired
          const { error: updateError } = await supabase
            .from('payment_requests')
            .update({ status: 'expired' })
            .eq('stripe_payment_link_id', paymentLink.id)
            .eq('status', 'pending');

          if (updateError) {
            console.error('Error expiring payment request:', updateError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}