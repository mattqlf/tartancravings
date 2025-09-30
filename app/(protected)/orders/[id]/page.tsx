"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, MapPin, Phone, Star, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database'
import Link from 'next/link'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            restaurant:restaurants(*),
            delivery_building:cmu_buildings(*),
            order_items(
              *,
              menu_item:menu_items(name, description)
            )
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching order:', error)
        } else {
          setOrder(data)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId, supabase])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Placed'
      case 'confirmed': return 'Confirmed by Restaurant'
      case 'preparing': return 'Being Prepared'
      case 'ready': return 'Ready for Pickup/Delivery'
      case 'delivered': return 'Delivered'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Order not found
            </h3>
            <p className="text-gray-600 mb-6">
              This order doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/orders">
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.order_number}
          </h1>
          <p className="text-gray-600">
            Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg border-2 ${getStatusColor(order.status)}`}>
          <p className="font-medium">{getStatusText(order.status)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {order.restaurant?.logo_url ? (
                  <img
                    src={order.restaurant.logo_url}
                    alt={order.restaurant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    🍽️
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{order.restaurant?.name}</h3>
                  <p className="text-gray-600">{order.restaurant?.cuisine_type}</p>
                  {order.restaurant?.phone && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <Phone className="h-4 w-4 mr-2" />
                      {order.restaurant.phone}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.menu_item_name}</h4>
                      {item.menu_item?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.menu_item.description}
                        </p>
                      )}
                      {item.special_instructions && (
                        <p className="text-sm text-orange-600 mt-1">
                          Special instructions: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {order.special_instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.special_instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Delivery Address</p>
                <p className="text-gray-600">{order.delivery_address}</p>
                {order.delivery_building && (
                  <p className="text-sm text-gray-500">{order.delivery_building.name}</p>
                )}
              </div>

              {order.delivery_instructions && (
                <div>
                  <p className="font-medium">Delivery Instructions</p>
                  <p className="text-gray-600">{order.delivery_instructions}</p>
                </div>
              )}

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {order.estimated_delivery_time
                  ? `Estimated: ${new Date(order.estimated_delivery_time).toLocaleTimeString()}`
                  : 'Estimating delivery time...'
                }
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${order.delivery_fee.toFixed(2)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.tip_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>${order.tip_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Paid via {order.payment_method === 'credit_card' ? 'Credit Card' : 'Dining Dollars'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status === 'delivered' && (
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full bg-cmu-red hover:bg-cmu-darkred">
                  <Star className="h-4 w-4 mr-2" />
                  Rate & Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}