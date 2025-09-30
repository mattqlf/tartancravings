"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { RestaurantForm } from '@/components/admin/RestaurantForm'
import { MenuManagement } from '@/components/admin/MenuManagement'
import { getAllRestaurantsForAdmin, deleteRestaurant } from '@/lib/api/admin'
import type { Restaurant } from '@/types/database'
import Link from 'next/link'

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMenuManagement, setShowMenuManagement] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | undefined>()
  const [managingMenuForRestaurant, setManagingMenuForRestaurant] = useState<Restaurant | undefined>()

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      const data = await getAllRestaurantsForAdmin()
      setRestaurants(data)
    } catch (error) {
      console.error('Failed to load restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const handleCreateNew = () => {
    setEditingRestaurant(undefined)
    setShowForm(true)
  }

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setShowForm(true)
  }

  const handleDelete = async (restaurant: Restaurant) => {
    if (!confirm(`Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteRestaurant(restaurant.id)
      await loadRestaurants()
    } catch (error) {
      alert(`Failed to delete restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFormSuccess = async (restaurant: Restaurant) => {
    setShowForm(false)
    setEditingRestaurant(undefined)
    await loadRestaurants()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingRestaurant(undefined)
  }

  const handleManageMenu = (restaurant: Restaurant) => {
    setManagingMenuForRestaurant(restaurant)
    setShowMenuManagement(true)
  }

  const handleMenuManagementBack = () => {
    setShowMenuManagement(false)
    setManagingMenuForRestaurant(undefined)
  }

  if (showForm) {
    return (
      <AdminGuard>
        <div className="max-w-6xl mx-auto p-6">
          <RestaurantForm
            restaurant={editingRestaurant}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </AdminGuard>
    )
  }

  if (showMenuManagement && managingMenuForRestaurant) {
    return (
      <AdminGuard>
        <div className="p-6">
          <MenuManagement
            restaurant={managingMenuForRestaurant}
            onBack={handleMenuManagementBack}
          />
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏴󠁧󠁢󠁳󠁣󠁴󠁿 Tartan Cravings Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Manage restaurants and menu items for the CMU community
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">
                Back to Site
              </Button>
            </Link>
            <Button
              onClick={handleCreateNew}
              className="bg-cmu-red hover:bg-cmu-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmu-red">
                {restaurants.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {restaurants.filter(r => r.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {restaurants.length > 0
                  ? (restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cmu-red mx-auto mb-4"></div>
                <p className="text-gray-600">Loading restaurants...</p>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No restaurants yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by adding your first restaurant to the platform.
                </p>
                <Button onClick={handleCreateNew} className="bg-cmu-red hover:bg-cmu-darkred">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Restaurant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Cuisine</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rating</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {restaurant.logo_url ? (
                              <img
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                className="w-8 h-8 rounded mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center text-xs">
                                🍽️
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{restaurant.name}</div>
                              {restaurant.phone && (
                                <div className="text-sm text-gray-500">{restaurant.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-cmu-red/10 text-cmu-red rounded-full text-xs font-medium">
                            {restaurant.cuisine_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {restaurant.building?.name || 'No building'}
                          {restaurant.building?.zone && (
                            <div className="text-xs text-gray-400">{restaurant.building.zone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            restaurant.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">⭐</span>
                            <span className="text-sm font-medium">{restaurant.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500 ml-1">({restaurant.total_reviews})</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Link href={`/restaurants/${restaurant.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageMenu(restaurant)}
                              title="Manage Menu"
                            >
                              <Menu className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(restaurant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(restaurant)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">View platform statistics</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-medium text-gray-900">Users</h3>
              <p className="text-sm text-gray-600">Manage user accounts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">🚚</div>
              <h3 className="font-medium text-gray-900">Orders</h3>
              <p className="text-sm text-gray-600">Monitor order activity</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600">Configure platform</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  )
}