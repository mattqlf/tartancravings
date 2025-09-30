export type UserRole = 'student' | 'staff' | 'restaurant' | 'admin'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
export type PaymentMethod = 'credit_card' | 'dining_dollars'

export interface CMUBuilding {
  id: number
  name: string
  code: string | null
  address: string
  latitude: number
  longitude: number
  zone: string
  is_active: boolean
  created_at: string
}

export interface User {
  id: string
  email: string
  andrew_id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  graduation_year: number | null
  major: string | null
  default_delivery_building: string | null
  default_delivery_address: string | null
  profile_picture_url: string | null
  dietary_preferences: string[] | null
  created_at: string
  updated_at: string
}

export interface Restaurant {
  id: string
  name: string
  description: string | null
  cuisine_type: string
  building_id: number | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  email: string | null
  website_url: string | null
  logo_url: string | null
  cover_image_url: string | null
  opening_hours: Record<string, { open: string; close: string }> | null
  minimum_order: number
  base_delivery_fee: number
  accepts_dining_dollars: boolean
  average_prep_time: number
  is_active: boolean
  rating: number
  total_reviews: number
  created_at: string
  updated_at: string
  building?: CMUBuilding
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  dietary_tags: string[] | null
  allergens: string[] | null
  calories: number | null
  spice_level: number | null
  prep_time: number
  is_available: boolean
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
  category?: MenuCategory
  restaurant?: Restaurant
}

export interface DeliveryZone {
  id: string
  name: string
  description: string | null
  price_per_mile: number
  base_fee: number
  minimum_fee: number
  maximum_fee: number
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  restaurant_id: string
  order_number: string
  status: OrderStatus
  delivery_building_id: number | null
  delivery_address: string
  delivery_instructions: string | null
  delivery_latitude: number | null
  delivery_longitude: number | null
  subtotal: number
  delivery_fee: number
  tax_amount: number
  tip_amount: number
  total: number
  distance_miles: number | null
  payment_method: PaymentMethod
  payment_intent_id: string | null
  estimated_prep_time: number | null
  estimated_delivery_time: string | null
  confirmed_at: string | null
  ready_at: string | null
  delivered_at: string | null
  special_instructions: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  user?: User
  restaurant?: Restaurant
  delivery_building?: CMUBuilding
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  menu_item_name: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions: string | null
  created_at: string
  menu_item?: MenuItem
}

export interface Review {
  id: string
  user_id: string
  restaurant_id: string
  order_id: string | null
  rating: number
  comment: string | null
  food_rating: number | null
  delivery_rating: number | null
  created_at: string
  user?: User
  restaurant?: Restaurant
  order?: Order
}

export interface UserFavorite {
  id: string
  user_id: string
  restaurant_id: string
  created_at: string
  restaurant?: Restaurant
}

export interface CartItem {
  id: string
  user_id: string
  restaurant_id: string
  menu_item_id: string
  quantity: number
  special_instructions: string | null
  created_at: string
  updated_at: string
  menu_item?: MenuItem
  restaurant?: Restaurant
}

// Utility types for API responses
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Form types
export interface CartItemInput {
  menu_item_id: string
  quantity: number
  special_instructions?: string
}

export interface OrderInput {
  restaurant_id: string
  delivery_building_id?: number
  delivery_address: string
  delivery_instructions?: string
  payment_method: PaymentMethod
  special_instructions?: string
  tip_amount?: number
}

export interface ReviewInput {
  restaurant_id: string
  order_id?: string
  rating: number
  comment?: string
  food_rating?: number
  delivery_rating?: number
}

// Search and filter types
export interface RestaurantFilters {
  cuisine_types?: string[]
  min_rating?: number
  accepts_dining_dollars?: boolean
  is_open?: boolean
  zones?: string[]
  search?: string
}

export interface MenuItemFilters {
  category_id?: string
  dietary_tags?: string[]
  max_price?: number
  is_featured?: boolean
  search?: string
}

// Distance and pricing calculations
export interface DistanceCalculation {
  distance_miles: number
  estimated_time_minutes: number
  delivery_fee: number
}

export interface PricingBreakdown {
  subtotal: number
  delivery_fee: number
  tax_amount: number
  tip_amount: number
  total: number
}
