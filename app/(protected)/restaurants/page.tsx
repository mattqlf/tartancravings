"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RestaurantCard } from '@/components/restaurant/RestaurantCard'
import { getRestaurants, getCuisineTypes, getRestaurantZones, getUserFavoriteRestaurants } from '@/lib/api/restaurants'
import type { Restaurant, RestaurantFilters } from '@/types/database'

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([])
  const [zones, setZones] = useState<string[]>([])
  const [filters, setFilters] = useState<RestaurantFilters>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [restaurantsData, cuisines, restaurantZones, favoritesList] = await Promise.all([
          getRestaurants(filters),
          getCuisineTypes(),
          getRestaurantZones(),
          getUserFavoriteRestaurants()
        ])

        setRestaurants(restaurantsData.data)
        setCuisineTypes(cuisines)
        setZones(restaurantZones)
        setFavoriteRestaurants(new Set(favoritesList.map(r => r.id)))
      } catch (error) {
        console.error('Failed to load restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle search and filter changes
  useEffect(() => {
    const loadFilteredRestaurants = async () => {
      try {
        setLoading(true)
        const searchFilters = {
          ...filters,
          search: searchQuery || undefined
        }
        const data = await getRestaurants(searchFilters)
        setRestaurants(data.data)
      } catch (error) {
        console.error('Failed to filter restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(loadFilteredRestaurants, 300)
    return () => clearTimeout(debounceTimer)
  }, [filters, searchQuery])

  const handleFilterChange = (key: keyof RestaurantFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleFavoriteChange = (restaurantId: string, isFavorite: boolean) => {
    const newFavorites = new Set(favoriteRestaurants)
    if (isFavorite) {
      newFavorites.add(restaurantId)
    } else {
      newFavorites.delete(restaurantId)
    }
    setFavoriteRestaurants(newFavorites)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || searchQuery

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Campus Restaurants
        </h1>
        <p className="text-gray-600">
          Discover and order from your favorite CMU dining spots
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search restaurants, cuisines, or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-cmu-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4">
              <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="space-y-4">
                {/* Cuisine Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cuisine Type</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {cuisineTypes.map(cuisine => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cuisine-${cuisine}`}
                          checked={filters.cuisine_type === cuisine}
                          onCheckedChange={(checked) =>
                            handleFilterChange('cuisine_type', checked ? cuisine : undefined)
                          }
                        />
                        <Label htmlFor={`cuisine-${cuisine}`} className="text-sm">
                          {cuisine}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campus Zone */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Campus Zone</Label>
                  <div className="space-y-2">
                    {zones.map(zone => (
                      <div key={zone} className="flex items-center space-x-2">
                        <Checkbox
                          id={`zone-${zone}`}
                          checked={filters.zone === zone}
                          onCheckedChange={(checked) =>
                            handleFilterChange('zone', checked ? zone : undefined)
                          }
                        />
                        <Label htmlFor={`zone-${zone}`} className="text-sm">
                          {zone}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Filters */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dining-dollars"
                      checked={filters.accepts_dining_dollars === true}
                      onCheckedChange={(checked) =>
                        handleFilterChange('accepts_dining_dollars', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="dining-dollars" className="text-sm">
                      Accepts Dining Dollars
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="high-rated"
                      checked={filters.min_rating === 4}
                      onCheckedChange={(checked) =>
                        handleFilterChange('min_rating', checked ? 4 : undefined)
                      }
                    />
                    <Label htmlFor="high-rated" className="text-sm">
                      4+ Stars Only
                    </Label>
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No restaurants found
          </h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms'
              : 'No restaurants are currently available'
            }
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={favoriteRestaurants.has(restaurant.id)}
              onFavoriteChange={(isFavorite) => handleFavoriteChange(restaurant.id, isFavorite)}
            />
          ))}
        </div>
      )}

      {/* Load More / Pagination could go here */}
    </div>
  )
}