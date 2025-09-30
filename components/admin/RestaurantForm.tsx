"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  createRestaurant,
  updateRestaurant,
  getCMUBuildings,
  DEFAULT_OPENING_HOURS,
  CUISINE_TYPES,
  type RestaurantFormData
} from '@/lib/api/admin'
import type { Restaurant, CMUBuilding } from '@/types/database'

interface RestaurantFormProps {
  restaurant?: Restaurant
  onSuccess: (restaurant: Restaurant) => void
  onCancel: () => void
}

export function RestaurantForm({ restaurant, onSuccess, onCancel }: RestaurantFormProps) {
  const [loading, setLoading] = useState(false)
  const [buildings, setBuildings] = useState<CMUBuilding[]>([])
  const [formData, setFormData] = useState<RestaurantFormData>({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    cuisine_type: restaurant?.cuisine_type || '',
    building_id: restaurant?.building_id || null,
    address: restaurant?.address || '',
    latitude: restaurant?.latitude || 40.4443,
    longitude: restaurant?.longitude || -79.9427,
    phone: restaurant?.phone || '',
    email: restaurant?.email || '',
    website_url: restaurant?.website_url || '',
    logo_url: restaurant?.logo_url || '',
    cover_image_url: restaurant?.cover_image_url || '',
    opening_hours: restaurant?.opening_hours || DEFAULT_OPENING_HOURS,
    minimum_order: restaurant?.minimum_order || 0,
    base_delivery_fee: restaurant?.base_delivery_fee || 2.99,
    accepts_dining_dollars: restaurant?.accepts_dining_dollars || false,
    average_prep_time: restaurant?.average_prep_time || 30,
    is_active: restaurant?.is_active ?? true
  })

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsData = await getCMUBuildings()
        setBuildings(buildingsData)
      } catch (error) {
        console.error('Failed to load buildings:', error)
      }
    }
    loadBuildings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result: Restaurant
      if (restaurant?.id) {
        result = await updateRestaurant(restaurant.id, formData)
      } else {
        result = await createRestaurant(formData)
      }
      onSuccess(result)
    } catch (error) {
      alert(`Failed to ${restaurant ? 'update' : 'create'} restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateOpeningHours = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => {
      const openingHours: Record<string, { open: string; close: string }> = prev.opening_hours
        ? { ...prev.opening_hours }
        : { ...DEFAULT_OPENING_HOURS }

      const currentDayHours: { open: string; close: string } = openingHours[day] ?? {
        open: '',
        close: ''
      }

      return {
        ...prev,
        opening_hours: {
          ...openingHours,
          [day]: {
            ...currentDayHours,
            [field]: value
          }
        }
      }
    })
  }

  const handleBuildingChange = (buildingId: string) => {
    const building = buildings.find(b => b.id.toString() === buildingId)
    if (building) {
      setFormData(prev => ({
        ...prev,
        building_id: building.id,
        address: building.address,
        latitude: building.latitude,
        longitude: building.longitude
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {restaurant ? 'Edit Restaurant' : 'Create New Restaurant'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="cuisine_type">Cuisine Type *</Label>
              <select
                id="cuisine_type"
                value={formData.cuisine_type}
                onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select cuisine type</option>
                {CUISINE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md h-20"
              placeholder="Brief description of the restaurant..."
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="building">CMU Building</Label>
              <select
                id="building"
                value={formData.building_id || ''}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a building</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name} ({building.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(412) 268-1234"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="restaurant@example.com"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="cover_image_url">Cover Image URL</Label>
              <Input
                id="cover_image_url"
                type="url"
                value={formData.cover_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>

          {/* Operating Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minimum_order">Minimum Order ($)</Label>
              <Input
                id="minimum_order"
                type="number"
                step="0.01"
                value={formData.minimum_order}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="base_delivery_fee">Base Delivery Fee ($)</Label>
              <Input
                id="base_delivery_fee"
                type="number"
                step="0.01"
                value={formData.base_delivery_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, base_delivery_fee: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="average_prep_time">Avg Prep Time (minutes)</Label>
              <Input
                id="average_prep_time"
                type="number"
                value={formData.average_prep_time}
                onChange={(e) => setFormData(prev => ({ ...prev, average_prep_time: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accepts_dining_dollars"
                checked={formData.accepts_dining_dollars}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, accepts_dining_dollars: !!checked }))
                }
              />
              <Label htmlFor="accepts_dining_dollars">Accepts Dining Dollars</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, is_active: !!checked }))
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <Label className="text-base font-medium mb-4 block">Opening Hours</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(formData.opening_hours || {}).map(([day, hours]) => (
                <div key={day} className="space-y-2">
                  <Label className="capitalize">{day}</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateOpeningHours(day, 'open', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateOpeningHours(day, 'close', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cmu-red hover:bg-cmu-darkred"
            >
              {loading ? 'Saving...' : (restaurant ? 'Update Restaurant' : 'Create Restaurant')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
