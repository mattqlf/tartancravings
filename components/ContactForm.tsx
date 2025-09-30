'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User } from 'lucide-react';

interface ContactFormProps {
  currentDisplayName: string | null;
  currentPhone: string | null;
  onContactSaved: () => void;
}

export function ContactForm({ currentDisplayName, currentPhone, onContactSaved }: ContactFormProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          phone_number: phoneNumber.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      onContactSaved();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const hasContactInfo = currentDisplayName && currentDisplayName.trim();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        <CardDescription>
          Set your display name and optional contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasContactInfo ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your profile is set up! Display name: <span className="font-semibold">{currentDisplayName}</span>
                {currentPhone && (
                  <span>, Phone: <span className="font-semibold">{currentPhone}</span></span>
                )}
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Update Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Please set up your profile information to start using the delivery platform.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                required
              />
              <p className="text-xs text-muted-foreground">
                This name will be visible to other users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <p className="text-xs text-muted-foreground">
                For coordination between buyer and driver
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-bottom-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 animate-in fade-in-0 slide-in-from-bottom-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Platform Info:</strong> This is a matchmaking platform. Payment arrangements are made directly between buyers and drivers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}