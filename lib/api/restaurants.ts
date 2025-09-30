import { createClient } from '@/lib/supabase/client'
import type { Restaurant, RestaurantFilters, PaginatedResponse } from '@/types/database'

const supabase = createClient()

export async function getRestaurants(
  filters: RestaurantFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Restaurant>> {
  let query = supabase
    .from('restaurants')
    .select(`
      *,
      building:cmu_buildings(*)
    `)
    .eq('is_active', true)

  // Apply filters
  if (filters.cuisine_type) {
    query = query.eq('cuisine_type', filters.cuisine_type)
  }

  if (filters.min_rating) {
    query = query.gte('rating', filters.min_rating)
  }

  if (filters.accepts_dining_dollars !== undefined) {
    query = query.eq('accepts_dining_dollars', filters.accepts_dining_dollars)
  }

  if (filters.zone) {
    query = query.eq('building.zone', filters.zone)
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,cuisine_type.ilike.%${filters.search}%`)
  }

  // Add pagination
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .range(from, to)
    .order('rating', { ascending: false })

  if (error) {
    console.error('Restaurant fetch error:', error)
    // Return empty result instead of throwing for better UX
    return {
      data: [],
      count: 0,
      page,
      limit,
      total_pages: 0
    }
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit)
  }
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      building:cmu_buildings(*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Restaurant not found
    }
    throw new Error(`Failed to fetch restaurant: ${error.message}`)
  }

  return data
}

export async function getCuisineTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('cuisine_type')
    .eq('is_active', true)

  if (error) {
    throw new Error(`Failed to fetch cuisine types: ${error.message}`)
  }

  const uniqueCuisines = [...new Set(data?.map(r => r.cuisine_type) || [])]
  return uniqueCuisines.sort()
}

export async function getRestaurantZones(): Promise<string[]> {
  const { data, error } = await supabase
    .from('cmu_buildings')
    .select('zone')
    .eq('is_active', true)

  if (error) {
    throw new Error(`Failed to fetch zones: ${error.message}`)
  }

  const uniqueZones = [...new Set(data?.map(b => b.zone) || [])]
  return uniqueZones.sort()
}

export async function isRestaurantOpen(restaurant: Restaurant): Promise<boolean> {
  if (!restaurant.opening_hours) {
    return false
  }

  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  const todayHours = restaurant.opening_hours[currentDay]
  if (!todayHours) {
    return false
  }

  return currentTime >= todayHours.open && currentTime <= todayHours.close
}

export async function toggleFavoriteRestaurant(restaurantId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .single()

  if (existing) {
    // Remove from favorites
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', existing.id)

    if (error) {
      throw new Error(`Failed to remove favorite: ${error.message}`)
    }
    return false
  } else {
    // Add to favorites
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId
      })

    if (error) {
      throw new Error(`Failed to add favorite: ${error.message}`)
    }
    return true
  }
}

export async function getUserFavoriteRestaurants(): Promise<Restaurant[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      restaurant:restaurants(
        *,
        building:cmu_buildings(*)
      )
    `)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to fetch favorite restaurants: ${error.message}`)
  }

  const rows = Array.isArray(data) ? data : []

  const isRestaurantRecord = (value: unknown): value is Restaurant => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false
    }
    const candidate = value as Partial<Restaurant>
    return typeof candidate.id === 'string' && typeof candidate.name === 'string'
  }

  return rows
    .map(row => (row as { restaurant?: unknown }).restaurant)
    .filter(isRestaurantRecord)
}
