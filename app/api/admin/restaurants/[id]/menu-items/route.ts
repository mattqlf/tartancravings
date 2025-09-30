import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const restaurantId = params?.id
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required.' },
        { status: 400 }
      )
    }
    const supabase = await createClient()

    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(id, name)
      `)
      .eq('restaurant_id', restaurantId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to fetch menu items: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: menuItems, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const params = await context.params
    const restaurantId = params?.id
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required.' },
        { status: 400 }
      )
    }
    const body = await request.json()
    const supabase = await createClient()

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurantId,
        category_id: body.category_id,
        name: body.name,
        description: body.description,
        price: body.price,
        image_url: body.image_url,
        dietary_tags: body.dietary_tags,
        allergens: body.allergens,
        calories: body.calories,
        spice_level: body.spice_level,
        prep_time: body.prep_time || 15,
        is_available: body.is_available !== false,
        is_featured: body.is_featured || false,
        display_order: body.display_order || 0
      })
      .select(`
        *,
        category:menu_categories(id, name)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to create menu item: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: menuItem, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
