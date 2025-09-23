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

        console.log('Checkout session completed:', {
          sessionId: session.id,
          paymentLink: session.payment_link,
          metadata: session.metadata,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details?.email,
          url: session.url,
        });

        // Find the payment request by payment link ID
        const { data: paymentRequest, error: findError } = await supabase
          .from('payment_requests')
          .select('id, recipient_id')
          .eq('stripe_payment_link_id', session.payment_link)
          .single();

        if (findError || !paymentRequest) {
          console.error('Payment request not found for session:', session.id, 'payment_link:', session.payment_link);
          console.error('Database error:', findError);

          // Try to find by URL if payment_link ID doesn't work
          if (session.url) {
            const { data: fallbackRequest } = await supabase
              .from('payment_requests')
              .select('id, recipient_id')
              .eq('payment_link_url', session.url)
              .single();

            if (fallbackRequest) {
              console.log('Found payment request by URL fallback');
              const { error: updateError } = await supabase
                .from('payment_requests')
                .update({
                  status: 'paid',
                  stripe_session_id: session.id,
                  paid_by_email: session.customer_details?.email || null,
                  paid_at: new Date().toISOString(),
                })
                .eq('id', fallbackRequest.id);

              if (!updateError) {
                console.log('Payment completed (via URL fallback) for request:', fallbackRequest.id);
              }
            }
          }
          break;
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
          .eq('id', paymentRequest.id);

        if (updateError) {
          console.error('Error updating payment request:', updateError);
        } else {
          console.log('✅ Successfully updated payment request to paid');
        }

        console.log('Payment completed for request:', paymentRequest.id);
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