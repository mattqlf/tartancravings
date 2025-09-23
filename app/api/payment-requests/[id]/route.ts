import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get payment request details
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        profiles!payment_requests_recipient_id_fkey (
          id,
          display_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error || !paymentRequest) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentRequest);
  } catch (error) {
    console.error('Error fetching payment request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment request' },
      { status: 500 }
    );
  }
}