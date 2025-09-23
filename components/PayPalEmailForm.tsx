'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PayPalEmailFormProps {
  currentEmail?: string | null;
  isVerified?: boolean;
  onEmailSaved?: () => void;
}

export function PayPalEmailForm({ currentEmail, isVerified, onEmailSaved }: PayPalEmailFormProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/paypal/save-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email');
      }

      setSuccess(true);
      onEmailSaved?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentEmail && isVerified && !success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal/Venmo Status</CardTitle>
          <CardDescription>
            Receive payments instantly with your PayPal or Venmo email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>PayPal/Venmo connected</span>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Email:</strong> {currentEmail}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false);
              setEmail(currentEmail);
            }}
          >
            Update Email
          </Button>
          <p className="text-sm text-muted-foreground">
            You can now receive payments through QR codes instantly
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect PayPal/Venmo</CardTitle>
        <CardDescription>
          Enter your PayPal or Venmo email to receive payments instantly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paypal-email">PayPal/Venmo Email</Label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use the same email address associated with your PayPal or Venmo account
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Email saved successfully! You can now receive payments.</span>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : currentEmail ? 'Update Email' : 'Save Email'}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ No account verification required</p>
            <p>✓ Instant activation</p>
            <p>✓ Works with both PayPal and Venmo</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}