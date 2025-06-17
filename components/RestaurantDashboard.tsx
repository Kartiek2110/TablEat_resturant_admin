'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Menu,
  Table as TableIcon,
  Tag,
  Eye,
  EyeOff
} from "lucide-react"
import {
  subscribeToMenuItems,
  subscribeToTables,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateTableStatus,
  type MenuItem,
  type Table
} from '@/firebase/restaurant-service'
import { toast } from "sonner"

interface RestaurantDashboardProps {
  restaurantId?: string
}

export default function RestaurantDashboard({ restaurantId }: RestaurantDashboardProps) {
  const { restaurantName } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
    isBestSeller: false
  })

  useEffect(() => {
    if (!restaurantName) return

    setLoading(true)

    // Subscribe to menu items
    const unsubscribeMenu = subscribeToMenuItems(restaurantName, (items) => {
      setMenuItems(items)
      setLoading(false)
    })

    // Subscribe to tables
    const unsubscribeTables = subscribeToTables(restaurantName, (tableData) => {
      setTables(tableData)
    })

    return () => {
      unsubscribeMenu()
      unsubscribeTables()
    }
  }, [restaurantName])

  const handleAddMenuItem = async () => {
    if (!restaurantName || !newMenuItem.name.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await addMenuItem(restaurantName, {
        name: newMenuItem.name.trim(),
        description: newMenuItem.description.trim(),
        category: newMenuItem.category.trim() || 'General',
        price: newMenuItem.price || 0,
        available: newMenuItem.available,
        isBestSeller: newMenuItem.isBestSeller
      })
      
      setNewMenuItem({
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true,
        isBestSeller: false
      })
      setIsAddingMenuItem(false)
      toast.success('Menu item added successfully!')
    } catch (error) {
      console.error('Failed to add menu item:', error)
      toast.error('Failed to add menu item')
    }
  }

  const handleUpdateMenuItem = async () => {
    if (!restaurantName || !editingMenuItem) return

    try {
      await updateMenuItem(restaurantName, editingMenuItem.id, {
        name: editingMenuItem.name,
        description: editingMenuItem.description,
        category: editingMenuItem.category,
        price: editingMenuItem.price,
        available: editingMenuItem.available,
        isBestSeller: editingMenuItem.isBestSeller
      })
      
      setEditingMenuItem(null)
      toast.success('Menu item updated successfully!')
    } catch (error) {
      console.error('Failed to update menu item:', error)
      toast.error('Failed to update menu item')
    }
  }

  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (!restaurantName) return

    const confirmed = window.confirm(`Are you sure you want to delete "${itemName}"?`)
    if (!confirmed) return

    try {
      await deleteMenuItem(restaurantName, itemId)
      toast.success('Menu item deleted successfully!')
    } catch (error) {
      console.error('Failed to delete menu item:', error)
      toast.error('Failed to delete menu item')
    }
  }

  const toggleMenuItemAvailability = async (item: MenuItem) => {
    if (!restaurantName) return

    try {
      await updateMenuItem(restaurantName, item.id, {
        available: !item.available
      })
      toast.success(`${item.name} is now ${!item.available ? 'available' : 'unavailable'}`)
    } catch (error) {
      console.error('Failed to update menu item:', error)
      toast.error('Failed to update menu item')
    }
  }

  const toggleTableStatus = async (table: Table) => {
    if (!restaurantName) return

    try {
      await updateTableStatus(restaurantName, table.tableNumber, !table.occupied)
      toast.success(`Table ${table.tableNumber} is now ${!table.occupied ? 'occupied' : 'available'}`)
    } catch (error) {
      console.error('Failed to update table status:', error)
      toast.error('Failed to update table status')
    }
  }

  // Get unique categories
  const categories = [...new Set(menuItems.map(item => item.category))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Restaurant Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your restaurant's menu, tables, and settings</p>
      </div>

      <Tabs defaultValue="menu" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="menu" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Menu</span> ({menuItems.length})
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
            <TableIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Tables</span> ({tables.length})
          </TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                    Menu Items
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Manage your restaurant's menu items and categories
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddingMenuItem(true)}
                  className="flex items-center gap-2 w-full sm:w-auto text-sm"
                  size="sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sm:inline">Add Menu Item</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add Menu Item Form */}
              {isAddingMenuItem && (
                <Card className="mb-4 sm:mb-6 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Add New Menu Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Item Name *</Label>
                        <Input
                          id="name"
                          value={newMenuItem.name}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                          placeholder="Enter item name"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm">Category</Label>
                        <Input
                          id="category"
                          value={newMenuItem.category}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                          placeholder="e.g., Appetizers, Main Course"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newMenuItem.price || ''}
                          onChange={(e) => setNewMenuItem({ ...newMenuItem, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Options</Label>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newMenuItem.available}
                              onChange={(e) => setNewMenuItem({ ...newMenuItem, available: e.target.checked })}
                              className="scale-110"
                            />
                            <span className="text-xs sm:text-sm">Available</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newMenuItem.isBestSeller}
                              onChange={(e) => setNewMenuItem({ ...newMenuItem, isBestSeller: e.target.checked })}
                              className="scale-110"
                            />
                            <span className="text-xs sm:text-sm">Best Seller</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm">Description</Label>
                      <Textarea
                        id="description"
                        value={newMenuItem.description}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                        placeholder="Describe the dish, ingredients, etc."
                        rows={3}
                        className="text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingMenuItem(false)
                          setNewMenuItem({
                            name: '',
                            description: '',
                            price: 0,
                            category: '',
                            available: true,
                            isBestSeller: false
                          })
                        }}
                        className="w-full sm:w-auto text-sm"
                        size="sm"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleAddMenuItem} className="w-full sm:w-auto text-sm" size="sm">
                        <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Menu Items List */}
              <div className="space-y-4">
                {categories.length > 0 ? (
                  categories.map((category) => {
                    const categoryItems = menuItems.filter(item => item.category === category)
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-lg text-gray-900">{category}</h3>
                          <Badge variant="outline">{categoryItems.length} items</Badge>
                        </div>
                        <div className="grid gap-3">
                          {categoryItems.map((item) => (
                            <Card key={item.id} className="border">
                              <CardContent className="p-4">
                                {editingMenuItem?.id === item.id ? (
                                  // Edit Form
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <Input
                                        value={editingMenuItem.name}
                                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                                        placeholder="Item name"
                                      />
                                      <Input
                                        value={editingMenuItem.category}
                                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value })}
                                        placeholder="Category"
                                      />
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingMenuItem.price}
                                        onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseFloat(e.target.value) || 0 })}
                                        placeholder="Price"
                                      />
                                      <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={editingMenuItem.available}
                                            onChange={(e) => setEditingMenuItem({ ...editingMenuItem, available: e.target.checked })}
                                          />
                                          <span className="text-sm">Available</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            checked={editingMenuItem.isBestSeller}
                                            onChange={(e) => setEditingMenuItem({ ...editingMenuItem, isBestSeller: e.target.checked })}
                                          />
                                          <span className="text-sm">Best Seller</span>
                                        </label>
                                      </div>
                                    </div>
                                    <Textarea
                                      value={editingMenuItem.description}
                                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                                      placeholder="Description"
                                      rows={2}
                                    />
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingMenuItem(null)}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                      </Button>
                                      <Button size="sm" onClick={handleUpdateMenuItem}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  // Display Mode
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-base sm:text-lg truncate">{item.name}</h4>
                                        {item.isBestSeller && (
                                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                            ⭐ Best Seller
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                        <span className="font-bold text-green-600 text-base sm:text-lg">₹{item.price.toFixed(2)}</span>
                                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 sm:flex-nowrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleMenuItemAvailability(item)}
                                        className={`${item.available ? 'text-green-600' : 'text-red-600'} text-xs px-2 py-1 h-8 flex-shrink-0`}
                                      >
                                        {item.available ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                                        <span className="hidden sm:inline ml-1">{item.available ? 'Available' : 'Unavailable'}</span>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingMenuItem(item)}
                                        className="text-xs px-2 py-1 h-8 flex-shrink-0"
                                      >
                                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline ml-1">Edit</span>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                        className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-8 flex-shrink-0"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline ml-1">Delete</span>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <Menu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first menu item</p>
                    <Button onClick={() => setIsAddingMenuItem(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TableIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Table Management
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600">
                View and manage your restaurant's table status
              </p>
            </CardHeader>
            <CardContent>
              {tables.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {tables.map((table) => (
                    <Card key={table.id} className={`border-2 ${table.occupied ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-base sm:text-lg">Table {table.tableNumber}</h3>
                          <Badge 
                            variant={table.occupied ? "destructive" : "secondary"}
                            className={`text-xs ${table.occupied ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                          >
                            {table.occupied ? 'Occupied' : 'Available'}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1 mb-3">
                          <p>Capacity: {table.capacity} people</p>
                          {table.currentOrderId && (
                            <p className="text-blue-600">Order: #{table.currentOrderId.slice(-6)}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTableStatus(table)}
                          className="w-full text-xs sm:text-sm h-8 sm:h-9"
                        >
                          Mark as {table.occupied ? 'Available' : 'Occupied'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <TableIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tables configured</h3>
                  <p className="text-sm sm:text-base text-gray-600 px-4">Tables will appear here once they are set up through table management</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 