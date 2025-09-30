import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const params = await context.params
    const itemId = params?.itemId
    if (!itemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required.' },
        { status: 400 }
      )
    }
    const body = await request.json()

    const { data: cartItem, error } = await supabase
      .from('cart_items')
      .update({
        quantity: body.quantity,
        special_instructions: body.special_instructions
      })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select(`
        *,
        menu_item:menu_items(*),
        restaurant:restaurants(id, name, logo_url)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to update cart item: ${error.message}` },
        { status: 500 }
      )
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const params = await context.params
    const itemId = params?.itemId
    if (!itemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to remove cart item: ${error.message}` },
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
