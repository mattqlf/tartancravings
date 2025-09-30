'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, User, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { NotificationSystem } from '@/components/NotificationSystem';

interface DeliveryRequest {
  id: string;
  description: string;
  status: string;
  created_at: string;
  accepted_at: string;
  buyer_confirmed: boolean;
  driver_confirmed: boolean;
  buyer_confirmed_at?: string;
  driver_confirmed_at?: string;
  confirmation_started_at?: string;
  confirmation_completed_at?: string;
  buyer: {
    display_name: string;
    email: string;
  };
  deliverer: {
    display_name: string;
    email: string;
  };
}

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;
  const [delivery, setDelivery] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationStarted, setConfirmationStarted] = useState(false);
  const [userRole, setUserRole] = useState<'buyer' | 'deliverer' | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadDelivery();
    setupRealtimeSubscription();
  }, [deliveryId]);

  const setupRealtimeSubscription = async () => {
    // Set up authentication for private channels
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.realtime.setAuth(session.access_token);
    }

    // Subscribe to broadcast changes for this specific delivery request
    const subscription = supabase
      .channel(`delivery_request:${deliveryId}`, {
        config: { private: true },
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('🔄 Confirmation broadcast UPDATE received:', payload);
        setTimeout(() => {
          console.log('📱 Reloading confirmation data...');
          loadDelivery();
        }, 100);
      })
      .subscribe((status) => {
        console.log('📡 Confirmation broadcast subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadDelivery = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          buyer:buyer_id (display_name, email),
          deliverer:driver_id (display_name, email)
        `)
        .eq('id', deliveryId)
        .single();

      if (error || !data) {
        router.push('/delivery/driver');
        return;
      }

      // Determine user role
      if (data.buyer_id === user.id) {
        setUserRole('buyer');
      } else if (data.driver_id === user.id) {
        setUserRole('deliverer');
      } else {
        router.push('/dashboard');
        return;
      }

      setDelivery(data);

      // Check if confirmation is completed
      if (data.status === 'completed') {
        setConfirmationStarted(false);
      }
    } catch (err) {
      console.error('Error loading delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!delivery || !userRole) return;

    try {
      // Get current state first
      const { data: currentDelivery } = await supabase
        .from('delivery_requests')
        .select('buyer_confirmed, driver_confirmed, status')
        .eq('id', deliveryId)
        .single();

      if (!currentDelivery) return;

      // Update user's confirmation status
      const updateField = userRole === 'buyer' ? 'buyer_confirmed' : 'driver_confirmed';
      const timestampField = userRole === 'buyer' ? 'buyer_confirmed_at' : 'driver_confirmed_at';

      // Check if both will be confirmed after this update
      const otherUserConfirmed = userRole === 'buyer' ? currentDelivery.driver_confirmed : currentDelivery.buyer_confirmed;
      const willBeBothConfirmed = otherUserConfirmed; // The other user is already confirmed

      console.log('Current state:', currentDelivery);
      console.log('Other user confirmed:', otherUserConfirmed);
      console.log('Will both be confirmed after this update:', willBeBothConfirmed);

      // Update with appropriate status
      const updateData: any = {
        [updateField]: true,
        [timestampField]: new Date().toISOString(),
        confirmation_started_at: new Date().toISOString(),
      };

      // If both will be confirmed, mark as completed immediately
      if (willBeBothConfirmed) {
        updateData.status = 'completed';
        updateData.confirmation_completed_at = new Date().toISOString();
        console.log('🎉 Marking delivery as completed in single update');
      } else {
        updateData.status = 'confirming';
      }

      const { error } = await supabase
        .from('delivery_requests')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) {
        console.error('Error updating confirmation:', error);
        return;
      }

      console.log('✅ Confirmation update successful');
      setConfirmationStarted(true);

      // Reload the delivery data immediately
      setTimeout(() => {
        loadDelivery();
      }, 200);

    } catch (err) {
      console.error('Error in confirmDelivery:', err);
    }
  };


  const checkBothConfirmed = async () => {
    // This function is now mainly used for debugging/logging
    // The actual completion logic is handled in confirmDelivery()
    if (!delivery) return;

    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('buyer_confirmed, driver_confirmed, status')
        .eq('id', deliveryId)
        .single();

      if (error) {
        console.error('Error checking confirmation status:', error);
        return;
      }

      console.log('📊 Current confirmation status:', {
        buyer_confirmed: data?.buyer_confirmed,
        driver_confirmed: data?.driver_confirmed,
        status: data?.status,
        both_confirmed: data?.buyer_confirmed && data?.driver_confirmed
      });

    } catch (err) {
      console.error('Error in checkBothConfirmed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!delivery || !userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Delivery not found or access denied</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isCompleted = delivery.status === 'completed';
  const otherUserConfirmed = userRole === 'buyer' ? delivery.driver_confirmed : delivery.buyer_confirmed;
  const bothConfirmed = delivery.buyer_confirmed && delivery.driver_confirmed;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <NotificationSystem />
      <div className="relative">
      <div className="mb-8">
        <Link href="/dashboard">
          <button className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Delivery Confirmation</h1>
            <p className="text-muted-foreground">
              {isCompleted ? 'Delivery completed!' : 'Confirm delivery completion'}
            </p>
          </div>
          <Badge variant={isCompleted ? 'default' : 'secondary'} className={isCompleted ? 'bg-green-600' : ''}>
            {isCompleted ? 'Completed' : 'In Progress'}
          </Badge>
        </div>
      </div>

      {isCompleted ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-semibold">Delivery Completed!</h2>
              <p className="text-sm text-muted-foreground">
                Both parties have confirmed the delivery completion.
              </p>
              <p className="text-xs text-muted-foreground">
                Completed {formatDistanceToNow(new Date(delivery.confirmation_completed_at!))} ago
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {userRole === 'buyer' ? 'Deliverer' : 'Buyer'}: {userRole === 'buyer' ? delivery.deliverer.display_name : delivery.buyer.display_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{delivery.description}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(delivery.accepted_at))} ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Status */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Status</CardTitle>
              <CardDescription>
                Both parties must hold their confirmation button for 2 seconds simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {userRole === 'buyer' ? 'Buyer (You)' : 'Driver (You)'}
                </span>
                <Badge variant={userRole === 'buyer' ? delivery.buyer_confirmed : delivery.driver_confirmed ? 'default' : 'secondary'}>
                  {userRole === 'buyer' ? delivery.buyer_confirmed : delivery.driver_confirmed ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  {userRole === 'buyer' ? 'Deliverer' : 'Buyer'}
                </span>
                <Badge variant={otherUserConfirmed ? 'default' : 'secondary'}>
                  {otherUserConfirmed ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>

              {/* Confirm Button */}
              <div className="pt-4">
                <button
                  onClick={confirmDelivery}
                  disabled={isCompleted || (userRole === 'buyer' ? delivery.buyer_confirmed : delivery.driver_confirmed)}
                  className={`w-full h-20 rounded-lg font-semibold text-white transition-all duration-200 ${
                    userRole === 'buyer'
                      ? delivery.buyer_confirmed
                        ? 'bg-green-600'
                        : 'bg-green-500 hover:bg-green-600'
                      : delivery.driver_confirmed
                      ? 'bg-orange-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {userRole === 'buyer'
                    ? delivery.buyer_confirmed
                      ? 'Delivery Confirmed ✓'
                      : 'Confirm Delivery Received'
                    : delivery.driver_confirmed
                    ? 'Payment Confirmed ✓'
                    : 'Confirm Payment Received'}
                </button>
              </div>

              {bothConfirmed && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Both parties confirmed! Delivery is being marked as complete...
                  </AlertDescription>
                </Alert>
              )}

              {confirmationStarted && !otherUserConfirmed && (
                <Alert>
                  <AlertDescription>
                    Waiting for the other party to confirm. They need to click their button.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}