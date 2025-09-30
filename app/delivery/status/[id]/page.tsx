'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { NotificationSystem } from '@/components/NotificationSystem';

interface DeliveryRequest {
  id: string;
  description: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  deliverer?: {
    display_name: string;
    email: string;
  };
}

export default function DeliveryStatusPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.id as string;
  const [delivery, setDelivery] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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
        console.log('🔄 Status page: Broadcast UPDATE received:', payload);
        setTimeout(() => {
          console.log('📱 Reloading status page data...');
          loadDelivery();
        }, 100);
      })
      .subscribe((status) => {
        console.log('📡 Status page broadcast subscription status:', status);
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
          deliverer:driver_id (display_name, email)
        `)
        .eq('id', deliveryId)
        .eq('buyer_id', user.id)
        .single();

      if (error || !data) {
        router.push('/dashboard');
        return;
      }

      setDelivery(data);
    } catch (err) {
      console.error('Error loading delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('delivery_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .eq('status', 'pending'); // Only cancel if still pending

      if (error) {
        throw error;
      }

      await loadDelivery();
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Delivery request not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (delivery.status) {
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'accepted':
        return <Package className="h-16 w-16 text-blue-500" />;
      case 'confirming':
        return <CheckCircle className="h-16 w-16 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (delivery.status) {
      case 'pending':
        return 'Waiting for a deliverer to accept your request';
      case 'accepted':
        return `${delivery.deliverer?.display_name || 'A deliverer'} has accepted your request and is on the way`;
      case 'confirming':
        return 'Delivery completed - confirming with deliverer';
      case 'completed':
        return 'Your delivery has been completed';
      case 'cancelled':
        return 'This delivery request has been cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (delivery.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'confirming':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <NotificationSystem />
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Delivery Status</h1>
            <p className="text-muted-foreground">
              Track your delivery request in real-time
            </p>
          </div>
          <Badge className={getStatusColor()}>
            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            {getStatusIcon()}
            <h2 className="text-xl font-semibold">{getStatusMessage()}</h2>
            <p className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(delivery.created_at))} ago
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="font-medium">{delivery.description}</p>
          </div>


          {delivery.deliverer && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Deliverer</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <p className="font-medium">{delivery.deliverer.display_name || delivery.deliverer.email}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Timeline</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Created {formatDistanceToNow(new Date(delivery.created_at))} ago</span>
              </div>
              {delivery.accepted_at && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Accepted {formatDistanceToNow(new Date(delivery.accepted_at))} ago</span>
                </div>
              )}
              {delivery.completed_at && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Completed {formatDistanceToNow(new Date(delivery.completed_at))} ago</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {delivery.status === 'pending' && (
        <Card className="mt-6">
          <CardContent className="py-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Waiting for Deliverer</AlertTitle>
              <AlertDescription>
                Your request is visible to all deliverers. You'll be notified when someone accepts it.
              </AlertDescription>
            </Alert>
            <Button
              onClick={cancelRequest}
              disabled={cancelling}
              variant="destructive"
              className="w-full mt-4"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </CardContent>
        </Card>
      )}

      {delivery.status === 'accepted' && (
        <div className="mt-6 space-y-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>Deliverer on the way!</AlertTitle>
            <AlertDescription>
              {delivery.deliverer?.display_name || 'Your deliverer'} has accepted your request and will complete the delivery soon.
              Once delivered, you'll both need to confirm completion.
            </AlertDescription>
          </Alert>
          <Link href={`/delivery/confirm/${delivery.id}`}>
            <Button className="w-full">Go to Confirmation Page</Button>
          </Link>
        </div>
      )}

      {delivery.status === 'confirming' && (
        <div className="mt-6 space-y-4">
          <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
            <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">Confirming Delivery</AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              Your deliverer is confirming completion. Please go to the confirmation page to confirm you received your delivery.
            </AlertDescription>
          </Alert>
          <Link href={`/delivery/confirm/${delivery.id}`}>
            <Button className="w-full">Go to Confirmation Page</Button>
          </Link>
        </div>
      )}

      {delivery.status === 'completed' && (
        <Alert className="mt-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Delivery Complete!</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Thank you for using our delivery service. Both parties have confirmed completion.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}