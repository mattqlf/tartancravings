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

    // Get user's profile with PayPal email
    const { data: profile } = await supabase
      .from('profiles')
      .select('paypal_email, display_name, paypal_verified')
      .eq('id', user.id)
      .single();

    if (!profile?.paypal_email) {
      return NextResponse.json(
        { error: 'No PayPal email configured. Please add your PayPal/Venmo email first.' },
        { status: 400 }
      );
    }

    // Create Stripe Payment Link (no transfer_data since we'll use PayPal payouts)
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
      metadata: {
        recipient_id: user.id,
        recipient_email: user.email || '',
        paypal_email: profile.paypal_email,
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