"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Clock, MapPin, Star, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Restaurant } from '@/types/database'
import { toggleFavoriteRestaurant } from '@/lib/api/restaurants'

interface RestaurantCardProps {
  restaurant: Restaurant
  isFavorite?: boolean
  onFavoriteChange?: (isFavorite: boolean) => void
}

export function RestaurantCard({ restaurant, isFavorite = false, onFavoriteChange }: RestaurantCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [favorite, setFavorite] = useState(isFavorite)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsLoading(true)
      const newFavoriteStatus = await toggleFavoriteRestaurant(restaurant.id)
      setFavorite(newFavoriteStatus)
      onFavoriteChange?.(newFavoriteStatus)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatOpeningHours = () => {
    if (!restaurant.opening_hours) return 'Hours not available'

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = restaurant.opening_hours[today]

    if (!todayHours) return 'Closed today'

    return `${todayHours.open} - ${todayHours.close}`
  }

  const isCurrentlyOpen = () => {
    if (!restaurant.opening_hours) return false

    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5)

    const todayHours = restaurant.opening_hours[currentDay]
    if (!todayHours) return false

    return currentTime >= todayHours.open && currentTime <= todayHours.close
  }

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="relative">
          {restaurant.cover_image_url ? (
            <img
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-cmu-red/20 to-cmu-gold/20 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 p-2 rounded-full ${
              favorite ? 'text-red-500 bg-white/90' : 'text-gray-600 bg-white/90'
            } hover:bg-white`}
            onClick={handleFavoriteClick}
            disabled={isLoading}
          >
            <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
          </Button>

          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
            isCurrentlyOpen()
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {isCurrentlyOpen() ? 'Open' : 'Closed'}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {restaurant.name}
            </h3>
            {restaurant.rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                <span className="text-gray-500">({restaurant.total_reviews})</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {restaurant.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-cmu-red/10 text-cmu-red rounded-full text-xs font-medium">
                {restaurant.cuisine_type}
              </span>
              {restaurant.accepts_dining_dollars && (
                <span className="px-2 py-1 bg-cmu-gold/20 text-cmu-gold rounded-full text-xs font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Dining $
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatOpeningHours()}</span>
              <span>•</span>
              <span>{restaurant.average_prep_time} min</span>
            </div>

            {restaurant.building && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.building.name}</span>
                <span className="text-xs text-gray-500">({restaurant.building.zone})</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-600">
                Min order: ${restaurant.minimum_order.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">
                Delivery: ${restaurant.base_delivery_fee.toFixed(2)}+
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}