"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import type { Restaurant, MenuCategory, MenuItem, CartItem } from '@/types/database'

interface MenuItemWithQuantity extends MenuItem {
  quantity: number
  specialInstructions: string
}

export default function RestaurantDetailPage() {
  const params = useParams()
  const restaurantId = params.id as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<MenuItemWithQuantity[]>([])
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)

  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        setLoading(true)

        // Load restaurant details
        const restaurantRes = await fetch(`/api/restaurants/${restaurantId}`)
        if (!restaurantRes.ok) throw new Error('Restaurant not found')

        const restaurantData = await restaurantRes.json()
        setRestaurant(restaurantData.data)

        // Load menu categories and items
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch(`/api/restaurants/${restaurantId}/menu-categories`),
          fetch(`/api/restaurants/${restaurantId}/menu-items`)
        ])

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.data || [])
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json()
          setMenuItems(itemsData.data || [])
        }

        // Load existing cart
        await loadCart()
      } catch (error) {
        console.error('Failed to load restaurant data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurantData()
  }, [restaurantId])

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const cartData = await response.json()
        const restaurantCartItems = cartData.data.filter((item: CartItem) =>
          item.restaurant_id === restaurantId
        )
        setCart(restaurantCartItems.map((item: CartItem) => ({
          ...item.menu_item!,
          quantity: item.quantity,
          specialInstructions: item.special_instructions || ''
        })))
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    }
  }

  const addToCart = async (menuItem: MenuItem, quantity: number = 1, specialInstructions: string = '') => {
    try {
      setCartLoading(true)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: menuItem.id,
          quantity,
          special_instructions: specialInstructions
        })
      })

      if (response.ok) {
        await loadCart()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add item to cart')
      }
    } catch (error) {
      alert('Failed to add item to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const updateCartItemQuantity = (menuItem: MenuItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== menuItem.id))
    } else {
      setCart(prev => prev.map(item =>
        item.id === menuItem.id
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getItemQuantityInCart = (menuItem: MenuItem): number => {
    const cartItem = cart.find(item => item.id === menuItem.id)
    return cartItem?.quantity || 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const groupedMenuItems = categories.map(category => ({
    category,
    items: menuItems.filter(item => item.category_id === category.id)
  }))

  // Add uncategorized items
  const uncategorizedItems = menuItems.filter(item => !item.category_id)
  if (uncategorizedItems.length > 0) {
    groupedMenuItems.push({
      category: { id: 'uncategorized', name: 'Other Items', description: null, display_order: 999, is_active: true, restaurant_id: restaurantId, created_at: '' },
      items: uncategorizedItems
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h1>
        <Link href="/restaurants">
          <Button>Back to Restaurants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/restaurants">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
      </div>

      {/* Restaurant Info */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {restaurant.cover_image_url ? (
                <img
                  src={restaurant.cover_image_url}
                  alt={restaurant.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-cmu-red/20 to-cmu-gold/20 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-gray-600">{restaurant.description || 'No description available.'}</p>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                {restaurant.accepts_dining_dollars && (
                  <Badge className="bg-cmu-gold/20 text-cmu-gold">Dining Dollars</Badge>
                )}
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({restaurant.total_reviews} reviews)</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Prep time: {restaurant.average_prep_time} minutes</span>
                </div>
                {restaurant.building && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.building.name} ({restaurant.building.zone})</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span>Min order: ${restaurant.minimum_order.toFixed(2)}</span>
                  <span>Delivery: ${restaurant.base_delivery_fee.toFixed(2)}+</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Menu</h2>

          {groupedMenuItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No menu items available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedMenuItems.map(({ category, items }) => (
                <div key={category.id}>
                  <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                  {category.description && (
                    <p className="text-gray-600 mb-4">{category.description}</p>
                  )}

                  <div className="grid gap-4">
                    {items.map(item => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{item.name}</h4>
                                {item.is_featured && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                                )}
                                {!item.is_available && (
                                  <Badge variant="destructive">Unavailable</Badge>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                              )}

                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-lg">${item.price.toFixed(2)}</span>
                                {item.calories && (
                                  <span className="text-sm text-gray-500">{item.calories} cal</span>
                                )}
                              </div>

                              {(item.dietary_tags && item.dietary_tags.length > 0) && (
                                <div className="flex gap-1 mb-2">
                                  {item.dietary_tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-20 h-20 object-cover rounded-lg ml-4"
                              />
                            )}
                          </div>

                          {item.is_available && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                {getItemQuantityInCart(item) > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateCartItemQuantity(item, getItemQuantityInCart(item) - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center">{getItemQuantityInCart(item)}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateCartItemQuantity(item, getItemQuantityInCart(item) + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => addToCart(item)}
                                    disabled={cartLoading}
                                    className="bg-cmu-red hover:bg-cmu-darkred"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to Cart
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Order ({cartItemCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <span className="font-medium text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Delivery:</span>
                      <span>${restaurant.base_delivery_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Tax (est.):</span>
                      <span>${(cartTotal * 0.0825).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>${(cartTotal + restaurant.base_delivery_fee + (cartTotal * 0.0825)).toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button
                      className="w-full bg-cmu-red hover:bg-cmu-darkred"
                      disabled={cartTotal < restaurant.minimum_order}
                    >
                      {cartTotal < restaurant.minimum_order
                        ? `Minimum order $${restaurant.minimum_order.toFixed(2)}`
                        : 'Proceed to Checkout'
                      }
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}