'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function DeliveryRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        restaurant:restaurant_id (name),
        created_at
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setOrders(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (!description.trim()) {
        setError('Please provide a description of what needs to be delivered');
        return;
      }

      // Create delivery request
      const { data: deliveryRequest, error: createError } = await supabase
        .from('delivery_requests')
        .insert({
          buyer_id: user.id,
          order_id: selectedOrderId || null,
          description: description,
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        console.error('Supabase error:', createError);
        console.error('Error details:', {
          message: createError.message,
          code: createError.code,
          hint: createError.hint,
          details: createError.details
        });
        throw createError;
      }

      if (!deliveryRequest) {
        console.error('No delivery request returned from database');
        throw new Error('Failed to create delivery request - no data returned');
      }

      console.log('✅ Successfully created delivery request:', deliveryRequest);

      // Redirect to a page showing the request status
      router.push(`/delivery/status/${deliveryRequest.id}`);
    } catch (err: any) {
      console.error('Error creating delivery request:', err);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Full error object:', JSON.stringify(err, null, 2));

      if (err?.message) {
        setError(`Failed to create delivery request: ${err.message}`);
      } else {
        setError('Failed to create delivery request. Please check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Request Delivery</h1>
        <p className="text-muted-foreground">
          Create a delivery request for a driver to accept
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            New Delivery Request
          </CardTitle>
          <CardDescription>
            Enter the details for your delivery request. A driver will accept and complete the delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {orders.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="order">Link to Recent Order (Optional)</Label>
                <select
                  id="order"
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const order = orders.find(o => o.id === e.target.value);
                    if (order) {
                      setDescription(`Delivery for order #${order.order_number} from ${order.restaurant.name}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select an order...</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      Order #{order.order_number} - {order.restaurant.name} - ${order.total}
                    </option>
                  ))}
                </select>
              </div>
            )}


            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pick up order from Gates Center and deliver to Doherty Hall..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide details about pickup location, delivery location, compensation offered, and any special instructions
              </p>
            </div>


            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Request...' : 'Create Delivery Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}