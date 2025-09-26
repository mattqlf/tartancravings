'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Search, Package, History, User, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationSystem } from '@/components/NotificationSystem';

interface DeliveryRequest {
  id: string;
  description: string;
  status: string;
  created_at: string;
  accepted_at?: string;
  buyer_id: string;
  driver_id?: string;
  deliverer?: {
    display_name: string;
    email: string;
  };
  buyer?: {
    display_name: string;
    email: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<DeliveryRequest[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<DeliveryRequest[]>([]);
  const [availableRequests, setAvailableRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    loadData();
    setupRealtimeSubscription();
  }, [user]);

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
        console.log('🔄 Dashboard: Broadcast INSERT received:', payload);
        setTimeout(() => {
          console.log('📱 Reloading dashboard data...');
          loadData();
        }, 100);
      })
      .on('broadcast', { event: 'UPDATE' }, (payload) => {
        console.log('🔄 Dashboard: Broadcast UPDATE received:', payload);
        setTimeout(() => {
          console.log('📱 Reloading dashboard data...');
          loadData();
        }, 100);
      })
      .on('broadcast', { event: 'DELETE' }, (payload) => {
        console.log('🔄 Dashboard: Broadcast DELETE received:', payload);
        setTimeout(() => {
          console.log('📱 Reloading dashboard data...');
          loadData();
        }, 100);
      })
      .subscribe((status) => {
        console.log('📡 Dashboard broadcast subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard broadcast subscription active');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
  };

  const loadData = async () => {
    if (!user) return;

    console.log('🔍 Loading dashboard data for user:', user.id);

    try {
      // Load user's requests, deliveries, and available requests
      const [myRequestsResult, myDeliveriesResult, availableRequestsResult] = await Promise.all([
        // Requests I've made as a buyer
        supabase
          .from('delivery_requests')
          .select(`
            *,
            deliverer:driver_id (display_name, email)
          `)
          .eq('buyer_id', user.id)
          .in('status', ['pending', 'accepted', 'confirming'])
          .order('created_at', { ascending: false })
          .limit(5),

        // Deliveries I'm handling as a driver
        supabase
          .from('delivery_requests')
          .select(`
            *,
            buyer:buyer_id (display_name, email)
          `)
          .eq('driver_id', user.id)
          .in('status', ['accepted', 'confirming'])
          .order('accepted_at', { ascending: false })
          .limit(5),

        // Available requests for delivery (excluding my own)
        supabase
          .from('delivery_requests')
          .select(`
            *,
            buyer:buyer_id (display_name, email)
          `)
          .eq('status', 'pending')
          .neq('buyer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (myRequestsResult.data) {
        console.log('📝 My requests:', myRequestsResult.data.length);
        setMyRequests(myRequestsResult.data);
      }
      if (myDeliveriesResult.data) {
        console.log('🚚 My deliveries:', myDeliveriesResult.data.length);
        setMyDeliveries(myDeliveriesResult.data);
      }
      if (availableRequestsResult.data) {
        console.log('📋 Available requests:', availableRequestsResult.data.length);
        setAvailableRequests(availableRequestsResult.data);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'confirming':
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationSystem userId={user?.id} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your delivery requests and activities
              </p>
            </div>
            <Link href="/onboarding">
              <Button variant="outline" size="sm">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Request Delivery Action */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
                <Plus className="mr-2 h-5 w-5" />
                Request Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/delivery/request">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* My Requests */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
                  <Package className="mr-2 h-5 w-5" />
                  My Requests ({myRequests?.length || 0})
                </CardTitle>
                <Link href="/history">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {myRequests && myRequests.length > 0 ? (
                  myRequests.map((request: any) => (
                    <div key={request.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(request.status)}
                            <Badge className={`${getStatusColor(request.status)} text-xs`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <Link href={`/delivery/status/${request.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDistanceToNow(new Date(request.created_at))} ago
                        {request.deliverer && (
                          <span className="ml-2">
                            • Deliverer: {request.deliverer.display_name || request.deliverer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No active requests</p>
                    <Link href="/delivery/request">
                      <Button variant="ghost" size="sm" className="mt-2">
                        Create your first request
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deliveries I'm Handling */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                  <Search className="mr-2 h-5 w-5" />
                  My Deliveries ({myDeliveries?.length || 0})
                </CardTitle>
                <Link href="/delivery/driver">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {myDeliveries && myDeliveries.length > 0 ? (
                  myDeliveries.map((delivery: any) => (
                    <div key={delivery.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {delivery.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(delivery.status)}
                            <Badge className={`${getStatusColor(delivery.status)} text-xs`}>
                              {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <Link href={`/delivery/confirm/${delivery.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Accepted {formatDistanceToNow(new Date(delivery.accepted_at || delivery.created_at))} ago
                        {delivery.buyer && (
                          <span className="ml-2">
                            • Buyer: {delivery.buyer.display_name || delivery.buyer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No active deliveries</p>
                    <Link href="/delivery/driver">
                      <Button variant="ghost" size="sm" className="mt-2">
                        Browse available requests
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Requests */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                  <Search className="mr-2 h-5 w-5" />
                  Available Requests ({availableRequests?.length || 0})
                </CardTitle>
                <Link href="/delivery/driver">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {availableRequests && availableRequests.length > 0 ? (
                  availableRequests.map((request: any) => (
                    <div key={request.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(request.status)}
                            <Badge className={`${getStatusColor(request.status)} text-xs`}>
                              Available
                            </Badge>
                          </div>
                        </div>
                        <Link href="/delivery/driver">
                          <Button variant="ghost" size="sm">
                            Accept
                          </Button>
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDistanceToNow(new Date(request.created_at))} ago
                        {request.buyer && (
                          <span className="ml-2">
                            • Buyer: {request.buyer.display_name || request.buyer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No available requests</p>
                    <p className="text-xs mt-1">Check back later for delivery opportunities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-700 dark:text-gray-300">
                <History className="mr-2 h-5 w-5" />
                Complete History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View all your past delivery activities and completed transactions.
              </p>
              <Link href="/history">
                <Button variant="outline" className="w-full">
                  <History className="mr-2 h-4 w-4" />
                  View Full History
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {myRequests?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Active Requests</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {myDeliveries?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Active Deliveries</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}