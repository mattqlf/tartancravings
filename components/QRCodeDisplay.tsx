'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface QRCodeDisplayProps {
  url: string;
  amount?: number;
  paymentRequestId?: string;
}

export function QRCodeDisplay({ url, amount, paymentRequestId }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(dataUrl => {
        setQrCode(dataUrl);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
        setLoading(false);
      });
  }, [url]);

  // Set up real-time subscription for payment status updates
  useEffect(() => {
    if (!paymentRequestId) return;

    const supabase = createClient();

    // Subscribe to changes in this specific payment request
    const subscription = supabase
      .channel('payment_status_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payment_requests',
          filter: `id=eq.${paymentRequestId}`,
        },
        (payload) => {
          console.log('Payment status update received:', payload);
          const newStatus = (payload.new as any)?.status;

          if (newStatus === 'paid') {
            setPaymentStatus('paid');
            setShowSuccess(true);

            // Redirect to dashboard after showing success message
            setTimeout(() => {
              router.push('/dashboard');
            }, 3000);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [paymentRequestId, router]);

  if (loading) {
    return (
      <Card className="p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-[300px] h-[300px] bg-gray-100 animate-pulse rounded-lg" />
          <p className="text-sm text-muted-foreground">Generating QR code...</p>
        </div>
      </Card>
    );
  }

  if (showSuccess) {
    return (
      <Card className="p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-800">Payment Received!</h3>
          <p className="text-sm text-muted-foreground text-center">
            Your payment has been completed successfully.
            <br />
            Redirecting to dashboard in 3 seconds...
          </p>
          {amount && (
            <p className="text-2xl font-bold text-green-600">
              ${(amount / 100).toFixed(2)}
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        {qrCode && (
          <>
            <img
              src={qrCode}
              alt="Payment QR Code"
              className="border-2 border-gray-200 rounded-lg"
            />
            {amount && (
              <p className="text-2xl font-bold">
                ${(amount / 100).toFixed(2)}
              </p>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code to complete the payment
            </p>
            <div className="flex gap-2 pt-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Open payment link directly
              </a>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}