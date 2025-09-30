"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Save, X, MapPin, Phone, Mail, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getCMUBuildings } from '@/lib/api/admin'
import { getCMUDisplayName } from '@/lib/auth/cmu-validator'
import type { User, CMUBuilding } from '@/types/database'

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Halal',
  'Kosher',
  'Keto',
  'Low-Carb',
  'Low-Sodium'
]

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [buildings, setBuildings] = useState<CMUBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    graduation_year: '',
    major: '',
    default_delivery_building: '',
    default_delivery_address: '',
    dietary_preferences: [] as string[]
  })

  const supabase = createClient()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else if (profile) {
          setUser(profile)
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            graduation_year: profile.graduation_year?.toString() || '',
            major: profile.major || '',
            default_delivery_building: profile.default_delivery_building || '',
            default_delivery_address: profile.default_delivery_address || '',
            dietary_preferences: profile.dietary_preferences || []
          })
        }

        // Load CMU buildings
        const buildingsData = await getCMUBuildings()
        setBuildings(buildingsData)
      } catch (error) {
        console.error('Failed to load user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabase])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          major: formData.major,
          default_delivery_building: formData.default_delivery_building,
          default_delivery_address: formData.default_delivery_address,
          dietary_preferences: formData.dietary_preferences
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        full_name: formData.full_name,
        phone: formData.phone,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        major: formData.major,
        default_delivery_building: formData.default_delivery_building,
        default_delivery_address: formData.default_delivery_address,
        dietary_preferences: formData.dietary_preferences
      } : null)

      setEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!user) return

    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      graduation_year: user.graduation_year?.toString() || '',
      major: user.major || '',
      default_delivery_building: user.default_delivery_building || '',
      default_delivery_address: user.default_delivery_address || '',
      dietary_preferences: user.dietary_preferences || []
    })
    setEditing(false)
  }

  const toggleDietaryPreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(preference)
        ? prev.dietary_preferences.filter(p => p !== preference)
        : [...prev.dietary_preferences, preference]
    }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Failed to load user profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cmu-red hover:bg-cmu-darkred flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={saving}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="andrew_id">Andrew ID</Label>
                <Input
                  id="andrew_id"
                  value={user.andrew_id}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editing ? formData.full_name : (user.full_name || getCMUDisplayName(user.email))}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!editing}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editing ? formData.phone : (user.phone || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editing}
                  placeholder="(412) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="major">Major</Label>
                <Input
                  id="major"
                  value={editing ? formData.major : (user.major || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                  disabled={!editing}
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  value={editing ? formData.graduation_year : (user.graduation_year?.toString() || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, graduation_year: e.target.value }))}
                  disabled={!editing}
                  placeholder="2025"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_building">Default Building</Label>
                {editing ? (
                  <select
                    id="default_building"
                    value={formData.default_delivery_building}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_delivery_building: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a building</option>
                    {buildings.map(building => (
                      <option key={building.id} value={building.name}>
                        {building.name} ({building.zone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={user.default_delivery_building || 'Not set'}
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="default_address">Default Address</Label>
                <Input
                  id="default_address"
                  value={editing ? formData.default_delivery_address : (user.default_delivery_address || '')}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_delivery_address: e.target.value }))}
                  disabled={!editing}
                  placeholder="Room 123, Morewood Gardens"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Dietary Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {DIETARY_OPTIONS.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`diet-${option}`}
                    checked={editing
                      ? formData.dietary_preferences.includes(option)
                      : (user.dietary_preferences || []).includes(option)
                    }
                    onCheckedChange={() => editing && toggleDietaryPreference(option)}
                    disabled={!editing}
                  />
                  <Label
                    htmlFor={`diet-${option}`}
                    className="text-sm cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Account Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-cmu-red">0</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cmu-gold">$0.00</p>
                <p className="text-sm text-gray-600">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-600">Favorite Restaurants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}