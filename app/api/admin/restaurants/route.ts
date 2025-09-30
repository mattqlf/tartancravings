import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RestaurantFormData } from '@/lib/api/admin'

const ADMIN_EMAIL = 'mdli2@andrew.cmu.edu'

async function checkAdminAccess(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body: RestaurantFormData = await request.json()
    const supabase = await createClient()

    // Insert restaurant
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert([body])
      .select(`
        *,
        building:cmu_buildings(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to create restaurant: ${error.message}` },
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

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        building:cmu_buildings(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Failed to fetch restaurants: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: restaurants, success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}