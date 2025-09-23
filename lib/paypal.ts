if (!process.env.PAYPAL_CLIENT_ID) {
  throw new Error('Missing PAYPAL_CLIENT_ID environment variable');
}

if (!process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PAYPAL_CLIENT_SECRET environment variable');
}

// PayPal API base URLs
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

// Get OAuth access token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export interface PayoutRequest {
  recipientEmail: string;
  amount: number; // Amount in cents
  currency?: string;
  note?: string;
  recipientType?: 'EMAIL' | 'PHONE';
}

export interface PayoutResponse {
  success: boolean;
  payoutBatchId?: string;
  payoutItemId?: string;
  error?: string;
}

export async function createPayout({
  recipientEmail,
  amount,
  currency = 'USD',
  note = 'Payment via QR Code',
  recipientType = 'EMAIL'
}: PayoutRequest): Promise<PayoutResponse> {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Validate input amount
    if (amount === null || amount === undefined) {
      throw new Error(`Amount cannot be null or undefined: ${amount}`);
    }

    // Ensure amount is a positive integer (cents)
    const amountCents = Math.abs(Math.round(Number(amount)));

    // Convert to dollars with exactly 2 decimal places as string
    const amountDollars = (amountCents / 100).toFixed(2);

    // Additional validation
    if (amountCents <= 0) {
      throw new Error(`Invalid amount: ${amount} (converted to ${amountCents} cents)`);
    }

    if (parseFloat(amountDollars) <= 0) {
      throw new Error(`Invalid dollar amount: ${amountDollars} from ${amountCents} cents`);
    }

    // Validate email format
    if (!validatePayPalEmail(recipientEmail)) {
      throw new Error(`Invalid email format: ${recipientEmail}`);
    }

    // Build request body exactly as per PayPal API documentation
    const senderBatchId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const senderItemId = `item_${Date.now()}`;

    const requestBody = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: 'You have a payment!',
        email_message: note || 'Payment via QR Code'
      },
      items: [
        {
          recipient_type: recipientType,
          amount: {
            value: amountDollars,
            currency: currency
          },
          receiver: recipientEmail,
          note: note || 'Payment via QR Code',
          sender_item_id: senderItemId
        }
      ]
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (response.status === 201) {
      return {
        success: true,
        payoutBatchId: responseData.batch_header.payout_batch_id,
        payoutItemId: responseData.items?.[0]?.payout_item_id,
      };
    } else {
      // Extract specific error details if available
      let errorMessage = `PayPal API returned status ${response.status}`;
      if (responseData.message) {
        errorMessage += `: ${responseData.message}`;
      }
      if (responseData.details) {
        errorMessage += ` | Details: ${JSON.stringify(responseData.details)}`;
      }
      if (responseData.debug_id) {
        errorMessage += ` | Debug ID: ${responseData.debug_id}`;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PayPal error',
    };
  }
}

export async function getPayoutStatus(payoutBatchId: string) {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payouts/${payoutBatchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const responseData = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        status: responseData.batch_header.batch_status,
        items: responseData.items,
      };
    } else {
      return {
        success: false,
        error: `PayPal API returned status ${response.status}: ${JSON.stringify(responseData)}`,
      };
    }
  } catch (error) {
    console.error('PayPal status check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PayPal error',
    };
  }
}

export function validatePayPalEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}