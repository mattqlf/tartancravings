import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, description } = await request.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get user's profile with Stripe account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, display_name, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account connected. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    if (!profile.stripe_onboarding_complete) {
      // Check if onboarding is actually complete in Stripe
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);

      if (account.charges_enabled && account.payouts_enabled) {
        // Update the database
        await supabase
          .from('profiles')
          .update({ stripe_onboarding_complete: true })
          .eq('id', user.id);
      } else {
        return NextResponse.json(
          { error: 'Stripe onboarding not complete. Please complete onboarding first.' },
          { status: 400 }
        );
      }
    }

    // Create Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Payment to ${profile.display_name || user.email}`,
            description: description || 'P2P Payment via QR Code',
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      transfer_data: {
        destination: profile.stripe_account_id,
      },
      metadata: {
        recipient_id: user.id,
        recipient_email: user.email || '',
      },
    });

    // Save payment request to database
    const { data: paymentRequest, error: insertError } = await supabase
      .from('payment_requests')
      .insert({
        recipient_id: user.id,
        amount: Math.round(amount * 100), // Store in cents
        description: description || null,
        stripe_payment_link_id: paymentLink.id,
        payment_link_url: paymentLink.url,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving payment request:', insertError);
      return NextResponse.json(
        { error: 'Failed to save payment request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: paymentLink.url,
      requestId: paymentRequest.id,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}