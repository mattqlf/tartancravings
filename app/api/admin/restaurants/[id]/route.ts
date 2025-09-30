import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RestaurantFormData } from '@/lib/api/admin'

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

async function checkAdminAccess() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const id = params.id
    const body: Partial<RestaurantFormData> = await request.json()
    const supabase = await createClient()

    // Update restaurant
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        building:cmu_buildings(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to update restaurant: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: restaurant, success: true })
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
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const id = params.id
    const supabase = await createClient()

    // Delete restaurant
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to delete restaurant: ${error.message}` },
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