"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { Restaurant, MenuCategory, MenuItem } from '@/types/database'

interface MenuManagementProps {
  restaurant: Restaurant
  onBack: () => void
}

interface CategoryFormData {
  name: string
  description: string
  display_order: number
  is_active: boolean
}

interface MenuItemFormData {
  category_id: string | null
  name: string
  description: string
  price: number
  image_url: string
  dietary_tags: string[]
  allergens: string[]
  calories: number | null
  spice_level: number | null
  prep_time: number
  is_available: boolean
  is_featured: boolean
  display_order: number
}

export function MenuManagement({ restaurant, onBack }: MenuManagementProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>()
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>()

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  })

  const [itemForm, setItemForm] = useState<MenuItemFormData>({
    category_id: null,
    name: '',
    description: '',
    price: 0,
    image_url: '',
    dietary_tags: [],
    allergens: [],
    calories: null,
    spice_level: null,
    prep_time: 15,
    is_available: true,
    is_featured: false,
    display_order: 0
  })

  const loadMenuData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch(`/api/admin/restaurants/${restaurant.id}/menu-categories`),
        fetch(`/api/admin/restaurants/${restaurant.id}/menu-items`)
      ])

      const categoriesData = await categoriesRes.json()
      const itemsData = await itemsRes.json()

      if (categoriesData.success) setCategories(categoriesData.data)
      if (itemsData.success) setMenuItems(itemsData.data)
    } catch (error) {
      console.error('Failed to load menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenuData()
  }, [restaurant.id])

  const handleCreateCategory = () => {
    setCategoryForm({
      name: '',
      description: '',
      display_order: categories.length,
      is_active: true
    })
    setEditingCategory(undefined)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: MenuCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active
    })
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleCreateItem = () => {
    setItemForm({
      category_id: categories.length > 0 ? categories[0].id : null,
      name: '',
      description: '',
      price: 0,
      image_url: '',
      dietary_tags: [],
      allergens: [],
      calories: null,
      spice_level: null,
      prep_time: 15,
      is_available: true,
      is_featured: false,
      display_order: menuItems.length
    })
    setEditingItem(undefined)
    setShowItemForm(true)
  }

  const handleEditItem = (item: MenuItem) => {
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags || [],
      allergens: item.allergens || [],
      calories: item.calories,
      spice_level: item.spice_level,
      prep_time: item.prep_time,
      is_available: item.is_available,
      is_featured: item.is_featured,
      display_order: item.display_order
    })
    setEditingItem(item)
    setShowItemForm(true)
  }

  const submitCategoryForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCategory
        ? `/api/admin/restaurants/${restaurant.id}/menu-categories/${editingCategory.id}`
        : `/api/admin/restaurants/${restaurant.id}/menu-categories`

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (response.ok) {
        await loadMenuData()
        setShowCategoryForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save category')
      }
    } catch (error) {
      alert('Failed to save category')
    }
  }

  const submitItemForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingItem
        ? `/api/admin/restaurants/${restaurant.id}/menu-items/${editingItem.id}`
        : `/api/admin/restaurants/${restaurant.id}/menu-items`

      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm)
      })

      if (response.ok) {
        await loadMenuData()
        setShowItemForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save menu item')
      }
    } catch (error) {
      alert('Failed to save menu item')
    }
  }

  const deleteCategory = async (category: MenuCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/menu-categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMenuData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      alert('Failed to delete category')
    }
  }

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/menu-items/${item.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMenuData()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      alert('Failed to delete menu item')
    }
  }

  if (showCategoryForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setShowCategoryForm(false)} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submitCategoryForm} className="space-y-4">
              <div>
                <Label htmlFor="cat-name">Category Name *</Label>
                <Input
                  id="cat-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <Input
                  id="cat-desc"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="cat-order">Display Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cat-active"
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="cat-active">Active</Label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cmu-red hover:bg-cmu-darkred">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showItemForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => setShowItemForm(false)} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
          </h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submitItemForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input
                    id="item-name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <select
                    id="item-category"
                    value={itemForm.category_id || ''}
                    onChange={(e) => setItemForm(prev => ({ ...prev, category_id: e.target.value || null }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="item-desc">Description</Label>
                <textarea
                  id="item-desc"
                  value={itemForm.description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="item-price">Price ($) *</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="item-prep">Prep Time (min)</Label>
                  <Input
                    id="item-prep"
                    type="number"
                    value={itemForm.prep_time}
                    onChange={(e) => setItemForm(prev => ({ ...prev, prep_time: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="item-calories">Calories</Label>
                  <Input
                    id="item-calories"
                    type="number"
                    value={itemForm.calories || ''}
                    onChange={(e) => setItemForm(prev => ({ ...prev, calories: e.target.value ? parseInt(e.target.value) : null }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="item-image">Image URL</Label>
                <Input
                  id="item-image"
                  type="url"
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-dietary">Dietary Tags (comma-separated)</Label>
                  <Input
                    id="item-dietary"
                    value={itemForm.dietary_tags.join(', ')}
                    onChange={(e) => setItemForm(prev => ({ ...prev, dietary_tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="vegetarian, vegan, gluten-free"
                  />
                </div>

                <div>
                  <Label htmlFor="item-allergens">Allergens (comma-separated)</Label>
                  <Input
                    id="item-allergens"
                    value={itemForm.allergens.join(', ')}
                    onChange={(e) => setItemForm(prev => ({ ...prev, allergens: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="nuts, dairy, gluten"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="item-available"
                    checked={itemForm.is_available}
                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_available: !!checked }))}
                  />
                  <Label htmlFor="item-available">Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="item-featured"
                    checked={itemForm.is_featured}
                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_featured: !!checked }))}
                  />
                  <Label htmlFor="item-featured">Featured</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cmu-red hover:bg-cmu-darkred">
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-gray-600">{restaurant.name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateCategory} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={handleCreateItem} className="bg-cmu-red hover:bg-cmu-darkred">
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cmu-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No categories yet. Create your first category to organize menu items.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-left py-2">Order</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium">{category.name}</td>
                          <td className="py-2 text-gray-600">{category.description}</td>
                          <td className="py-2">{category.display_order}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteCategory(category)} className="text-red-600">
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

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Items ({menuItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No menu items yet. Add your first menu item to start building your menu.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Category</th>
                        <th className="text-left py-2">Price</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <div className="flex items-center">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded mr-2 object-cover" />
                              )}
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.is_featured && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Featured</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 text-gray-600">
                            {item.category?.name || 'No Category'}
                          </td>
                          <td className="py-2 font-medium">${item.price.toFixed(2)}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteItem(item)} className="text-red-600">
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
        </div>
      )}
    </div>
  )
}