import { createClient } from '@/lib/supabase/client'
import type { Restaurant, CMUBuilding } from '@/types/database'

const supabase = createClient()

export interface RestaurantFormData {
  name: string
  description: string
  cuisine_type: string
  building_id: number | null
  address: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website_url?: string
  logo_url?: string
  cover_image_url?: string
  opening_hours: Record<string, { open: string; close: string }> | null
  minimum_order: number
  base_delivery_fee: number
  accepts_dining_dollars: boolean
  average_prep_time: number
  is_active: boolean
}

export async function createRestaurant(data: RestaurantFormData): Promise<Restaurant> {
  const response = await fetch('/api/admin/restaurants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create restaurant')
  }

  return result.data
}

export async function updateRestaurant(id: string, data: Partial<RestaurantFormData>): Promise<Restaurant> {
  const response = await fetch(`/api/admin/restaurants/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update restaurant')
  }

  return result.data
}

export async function deleteRestaurant(id: string): Promise<void> {
  const response = await fetch(`/api/admin/restaurants/${id}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete restaurant')
  }
}

export async function getAllRestaurantsForAdmin(): Promise<Restaurant[]> {
  const response = await fetch('/api/admin/restaurants', {
    method: 'GET',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch restaurants')
  }

  return result.data || []
}

export async function getCMUBuildings(): Promise<CMUBuilding[]> {
  const { data, error } = await supabase
    .from('cmu_buildings')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch CMU buildings: ${error.message}`)
  }

  return data || []
}

export async function createCMUBuilding(building: Omit<CMUBuilding, 'id' | 'created_at'>): Promise<CMUBuilding> {
  const { data, error } = await supabase
    .from('cmu_buildings')
    .insert([building])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create building: ${error.message}`)
  }

  return data
}

// Check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === 'mdli2@andrew.cmu.edu'
}

// Default opening hours template
export const DEFAULT_OPENING_HOURS: Record<string, { open: string; close: string }> = {
  monday: { open: '09:00', close: '21:00' },
  tuesday: { open: '09:00', close: '21:00' },
  wednesday: { open: '09:00', close: '21:00' },
  thursday: { open: '09:00', close: '21:00' },
  friday: { open: '09:00', close: '22:00' },
  saturday: { open: '10:00', close: '22:00' },
  sunday: { open: '10:00', close: '20:00' }
}

// Common cuisine types
export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Indian',
  'Mexican',
  'Mediterranean',
  'Greek',
  'Vietnamese',
  'Pizza',
  'Burgers',
  'Sandwiches',
  'Salads',
  'Coffee & Bakery',
  'Desserts',
  'Healthy',
  'Vegan',
  'Vegetarian'
]
