import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePayPalEmail } from '@/lib/paypal';

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

    const { email } = await request.json();

    // Validate email format
    if (!email || !validatePayPalEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Update user's PayPal email
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        paypal_email: email,
        paypal_verified: true // Since we're not doing complex verification
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating PayPal email:', updateError);
      return NextResponse.json(
        { error: 'Failed to save PayPal email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PayPal email saved successfully'
    });
  } catch (error) {
    console.error('Error saving PayPal email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}