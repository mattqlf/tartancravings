import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CartItemInput } from '@/types/database'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_item:menu_items(*),
        restaurant:restaurants(id, name, logo_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to fetch cart: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: cartItems, success: true })
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

    const body: CartItemInput = await request.json()

    // Get the menu item to validate and get restaurant info
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*, restaurant:restaurants(id)')
      .eq('id', body.menu_item_id)
      .single()

    if (menuError || !menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Check if item already in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('menu_item_id', body.menu_item_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check cart' },
        { status: 500 }
      )
    }

    let cartItem
    if (existingItem) {
      // Update quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + body.quantity,
          special_instructions: body.special_instructions || existingItem.special_instructions
        })
        .eq('id', existingItem.id)
        .select(`
          *,
          menu_item:menu_items(*),
          restaurant:restaurants(id, name, logo_url)
        `)
        .single()

      if (updateError) {
        console.error('Database error:', updateError)
        return NextResponse.json(
          { error: `Failed to update cart: ${updateError.message}` },
          { status: 500 }
        )
      }
      cartItem = updatedItem
    } else {
      // Add new item
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          restaurant_id: menuItem.restaurant.id,
          menu_item_id: body.menu_item_id,
          quantity: body.quantity,
          special_instructions: body.special_instructions
        })
        .select(`
          *,
          menu_item:menu_items(*),
          restaurant:restaurants(id, name, logo_url)
        `)
        .single()

      if (insertError) {
        console.error('Database error:', insertError)
        return NextResponse.json(
          { error: `Failed to add to cart: ${insertError.message}` },
          { status: 500 }
        )
      }
      cartItem = newItem
    }

    return NextResponse.json({ data: cartItem, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to clear cart: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}