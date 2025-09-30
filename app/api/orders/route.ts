import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OrderInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    let query = supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(id, name, logo_url),
        order_items:order_items(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to fetch orders: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: orders, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: OrderInput = await request.json()

    // Get cart items for this restaurant
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_item:menu_items(id, name, price)
      `)
      .eq('user_id', user.id)
      .eq('restaurant_id', body.restaurant_id)

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart for this restaurant' },
        { status: 400 }
      )
    }

    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.menu_item.price * item.quantity)
    }, 0)

    const deliveryFee = 3.99 // Simple flat fee for now
    const taxAmount = subtotal * 0.0825 // 8.25% tax
    const tipAmount = body.tip_amount || 0
    const total = subtotal + deliveryFee + taxAmount + tipAmount

    // Generate order number
    const orderNumber = `TC${Date.now().toString().slice(-8)}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        restaurant_id: body.restaurant_id,
        order_number: orderNumber,
        status: 'pending',
        delivery_building_id: body.delivery_building_id,
        delivery_address: body.delivery_address,
        delivery_instructions: body.delivery_instructions,
        subtotal,
        delivery_fee: deliveryFee,
        tax_amount: taxAmount,
        tip_amount: tipAmount,
        total,
        payment_method: body.payment_method,
        special_instructions: body.special_instructions,
        estimated_prep_time: 30 // Default 30 minutes
      })
      .select()
      .single()

    if (orderError) {
      console.error('Database error:', orderError)
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message}` },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item.name,
      quantity: item.quantity,
      unit_price: item.menu_item.price,
      total_price: item.menu_item.price * item.quantity,
      special_instructions: item.special_instructions
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Database error:', itemsError)
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: `Failed to create order items: ${itemsError.message}` },
        { status: 500 }
      )
    }

    // Clear cart for this restaurant
    const { error: clearCartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', body.restaurant_id)

    if (clearCartError) {
      console.error('Warning: Failed to clear cart:', clearCartError)
    }

    // Fetch complete order with relations
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(id, name, logo_url),
        order_items:order_items(*)
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json({ data: order, success: true })
    }

    return NextResponse.json({ data: completeOrder, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}