'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Clock, MapPin, User, CheckCircle } from 'lucide-react';
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
  buyer_confirmed?: boolean;
  deliverer_confirmed?: boolean;
  buyer: {
    display_name: string;
    email: string;
  };
  order?: {
    order_number: string;
    restaurant: {
      name: string;
    };
  };
}

export default function DelivererDashboardPage() {
  const [availableRequests, setAvailableRequests] = useState<DeliveryRequest[]>([]);
  const [activeRequests, setActiveRequests] = useState<DeliveryRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadDeliveryRequests();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = async () => {
    // Set up authentication for private channels
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.realtime.setAuth(session.access_token);
    }

    // Subscribe to broadcast changes for all delivery requests
    const subscription = supabase
      .channel('delivery_requests_all', {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        console.log('🔄 Driver dashboard: Broadcast INSERT received:', payload);
        loadDeliveryRequests();
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('🔄 Driver dashboard: Broadcast UPDATE received:', payload);
        loadDeliveryRequests();
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        console.log('🔄 Driver dashboard: Broadcast DELETE received:', payload);
        loadDeliveryRequests();
      })
      .subscribe((status) => {
        console.log('📡 Driver dashboard broadcast subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  };


  const loadDeliveryRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Debug: Show current user info
      console.log('Current deliverer user:', { id: user.id, email: user.email });

      // Load available requests (pending) - exclude own requests
      const { data: available } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          buyer:buyer_id (display_name, email),
          order:order_id (
            order_number,
            restaurant:restaurant_id (name)
          )
        `)
        .eq('status', 'pending')
        .neq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      // Debug: Show what requests exist and their buyer IDs
      const { data: allPending } = await supabase
        .from('delivery_requests')
        .select('id, buyer_id, description, status')
        .eq('status', 'pending');

      console.log('All pending requests:', allPending);
      console.log('Available requests after filter:', available);


      // Load active requests (accepted by this deliverer)
      const { data: active } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          buyer:buyer_id (display_name, email),
          order:order_id (
            order_number,
            restaurant:restaurant_id (name)
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false });

      // Load completed requests (completed by this deliverer)
      const { data: completed } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          buyer:buyer_id (display_name, email),
          order:order_id (
            order_number,
            restaurant:restaurant_id (name)
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (available) setAvailableRequests(available);
      if (active) setActiveRequests(active);
      if (completed) setCompletedRequests(completed);
    } catch (err) {
      console.error('Error loading delivery requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setAcceptingId(requestId);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Double-check user isn't trying to accept their own request
      const request = availableRequests.find(r => r.id === requestId);
      if (request && request.buyer.email === user.email) {
        setError('You cannot accept your own delivery request');
        setAcceptingId(null);
        return;
      }


      // Accept the request
      const { error: updateError } = await supabase
        .from('delivery_requests')
        .update({
          driver_id: user.id,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending'); // Ensure it's still pending

      if (updateError) {
        console.error('Supabase update error:', updateError);
        if (updateError.code === 'PGRST116') {
          setError('This request has already been accepted');
        } else if (updateError.message) {
          setError(updateError.message);
        } else {
          setError('Failed to accept delivery request. Please try again.');
        }
        setAcceptingId(null);
        return;
      }

      // Refresh the lists
      await loadDeliveryRequests();
    } catch (err: any) {
      console.error('Error accepting request:', err);
      const errorMessage = err?.message || 'Failed to accept delivery request';
      setError(errorMessage);
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <NotificationSystem />
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Deliverer Dashboard</h1>
        <p className="text-muted-foreground">
          Accept and complete delivery requests
        </p>
      </div>


      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Deliveries</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeRequests.map((request) => (
              <Card key={request.id} className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Delivery Request
                      </CardTitle>
                      <CardDescription>{request.description}</CardDescription>
                    </div>
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Buyer: {request.buyer.display_name || request.buyer.email}</span>
                    </div>
                    {request.order && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Order #{request.order.order_number} from {request.order.restaurant.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Accepted {formatDistanceToNow(new Date(request.accepted_at!))} ago</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/delivery/confirm/${request.id}`}>
                      <Button className="w-full">View Confirmation Page</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Deliveries</h2>
        {availableRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No available delivery requests at the moment
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {"Available Request"}
                    </CardTitle>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {request.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Request: {request.description.substring(0, 30)}...</span>
                    </div>
                    {request.order && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{request.order.restaurant.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(request.created_at))} ago</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => acceptRequest(request.id)}
                    disabled={acceptingId === request.id}
                    className="w-full mt-4"
                  >
                    {acceptingId === request.id ? 'Accepting...' : 'Accept Delivery'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Deliveries</h2>
          <div className="space-y-2">
            {completedRequests.map((request) => (
              <Card key={request.id} className="bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Delivery Completed</p>
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.completed_at!))} ago
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}