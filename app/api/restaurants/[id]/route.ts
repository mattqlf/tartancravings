import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const restaurantId = params?.id
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required.' },
        { status: 400 }
      )
    }
    const supabase = await createClient()

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        building:cmu_buildings(*)
      `)
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single()

    if (error || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
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
