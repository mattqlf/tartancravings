'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentRequestForm } from '@/components/PaymentRequestForm';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RequestPaymentPage() {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentRequestId, setPaymentRequestId] = useState('');
  const [loading, setLoading] = useState(false);

  const createPaymentRequest = async (amountValue: number, description?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          description: description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment request');
      }

      setQrUrl(data.url);
      setAmount(amountValue * 100); // Convert to cents for display
      setPaymentRequestId(data.requestId);
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = () => {
    setQrUrl('');
    setAmount(0);
    setPaymentRequestId('');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Request Payment</h1>
        <p className="text-muted-foreground">
          Generate a QR code for someone to pay you
        </p>
      </div>

      {!qrUrl ? (
        <PaymentRequestForm onSubmit={createPaymentRequest} />
      ) : (
        <div className="space-y-6">
          <QRCodeDisplay url={qrUrl} amount={amount} paymentRequestId={paymentRequestId} />

          <div className="flex justify-center">
            <Button onClick={handleNewRequest} variant="outline">
              Create New Request
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Show this QR code to the person who will pay you</li>
              <li>They scan the code with their phone camera</li>
              <li>They complete the payment on Stripe&apos;s secure checkout</li>
              <li>The money is automatically transferred to your account</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}