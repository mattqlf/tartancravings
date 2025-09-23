import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createPayout } from '@/lib/paypal';
import { calculatePlatformFee, getPlatformConfig } from '@/lib/platform-config';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { paymentRequestId } = await request.json();

    if (!paymentRequestId) {
      return NextResponse.json(
        { error: 'Payment request ID is required' },
        { status: 400 }
      );
    }

    // Get payment request details
    const { data: paymentRequest, error: paymentError } = await supabase
      .from('payment_requests')
      .select(`
        *,
        profiles!inner(paypal_email, display_name)
      `)
      .eq('id', paymentRequestId)
      .eq('status', 'paid')
      .eq('payout_status', 'pending')
      .single();

    if (paymentError || !paymentRequest) {
      return NextResponse.json(
        { error: 'Payment request not found or not eligible for payout' },
        { status: 404 }
      );
    }

    const recipientEmail = paymentRequest.profiles.paypal_email;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient has no PayPal email configured' },
        { status: 400 }
      );
    }

    // Calculate platform fee and recipient payout
    const totalAmount = paymentRequest.amount;
    const { platformFeeCents, payoutAmountCents } = calculatePlatformFee(totalAmount);
    const platformConfig = getPlatformConfig();

    // Update payment request with fee calculation and processing status
    await supabase
      .from('payment_requests')
      .update({
        payout_status: 'processing',
        platform_fee: platformFeeCents,
        payout_amount: payoutAmountCents
      })
      .eq('id', paymentRequestId);

    // Create PayPal payout to recipient
    const recipientPayoutResult = await createPayout({
      recipientEmail,
      amount: payoutAmountCents,
      note: `Payment for: ${paymentRequest.description || 'QR Code Payment'}`,
    });

    // Create PayPal payout to platform (if fee > 0)
    let platformPayoutResult = null;
    if (platformFeeCents > 0) {
      platformPayoutResult = await createPayout({
        recipientEmail: platformConfig.hostEmail,
        amount: platformFeeCents,
        note: `Platform fee (20%) for: ${paymentRequest.description || 'QR Code Payment'}`,
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
        .eq('id', paymentRequestId);

      return NextResponse.json({
        success: true,
        recipientPayout: {
          payoutBatchId: recipientPayoutResult.payoutBatchId,
          payoutItemId: recipientPayoutResult.payoutItemId,
          amount: payoutAmountCents
        },
        platformPayout: platformFeeCents > 0 ? {
          payoutBatchId: platformPayoutResult?.payoutBatchId,
          payoutItemId: platformPayoutResult?.payoutItemId,
          amount: platformFeeCents
        } : null,
        platformFee: platformFeeCents,
        totalAmount: totalAmount
      });
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
        .eq('id', paymentRequestId);

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}