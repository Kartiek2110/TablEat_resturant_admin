'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Package, AlertTriangle, Crown, Lock, TrendingDown, TrendingUp, Shield, Eye, EyeOff } from "lucide-react"
import { 
  subscribeToInventoryItems, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem,
  subscribeToMenuItems,
  updateMenuItemIngredients,
  getRestaurantByAdminEmail,
  checkPremiumSubscription,
  verifyInventoryManagementCode,
  type InventoryItem,
  type MenuItem,
  type MenuItemIngredient,
  type Restaurant
} from '@/firebase/restaurant-service'
import { toast } from "sonner"

export default function InventoryManagement() {
  const { restaurantName, user } = useAuth()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authCode, setAuthCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    currentStock: '',
    minStockAlert: '',
    cost: '',
    supplier: ''
  })

  const units = ['pieces', 'kg', 'grams', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'packets', 'bottles']

  useEffect(() => {
    if (!restaurantName || !user?.email) return

    const fetchRestaurant = async () => {
      if (user?.email) {
        const restaurantData = await getRestaurantByAdminEmail(user.email)
        setRestaurant(restaurantData)
        setLoading(false)
      }
    }
    
    fetchRestaurant()
  }, [restaurantName, user?.email])

  useEffect(() => {
    if (!restaurantName || !isAuthorized || !restaurant?.inventory_management_approved) return

          const unsubscribeInventory = subscribeToInventoryItems(restaurantName, (items) => {
            setInventoryItems(items)
          })

          const unsubscribeMenu = subscribeToMenuItems(restaurantName, (items) => {
            setMenuItems(items)
          })

          return () => {
            unsubscribeInventory()
            unsubscribeMenu()
          }
  }, [restaurantName, isAuthorized, restaurant?.inventory_management_approved])

  const isPremium = restaurant ? checkPremiumSubscription(restaurant) : false
  const isInventoryApproved = restaurant?.inventory_management_approved === true

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName) return

    setAuthLoading(true)
    try {
      const isValid = await verifyInventoryManagementCode(restaurantName, authCode)
      if (isValid) {
        setIsAuthorized(true)
        toast.success("Access granted!")
      } else {
        toast.error("Invalid access code")
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      toast.error("Failed to verify access code")
    } finally {
      setAuthLoading(false)
    }
  }

  // Show access denied if not approved
  if (!loading && restaurant && !isInventoryApproved) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Inventory Management is not enabled for your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please contact support to enable inventory management features for your restaurant.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show code verification if approved but not authorized
  if (!loading && restaurant && isInventoryApproved && !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Inventory Management Access</CardTitle>
            <CardDescription>
              Enter the access code to manage inventory and stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <Label htmlFor="authCode">Access Code</Label>
                <div className="relative">
                  <Input
                    id="authCode"
                    type={showPassword ? "text" : "password"}
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Enter access code"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? "Verifying..." : "Access Inventory Management"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantName) return

    try {
      const currentStock = parseFloat(formData.currentStock)
      const minStockAlert = parseFloat(formData.minStockAlert)
      const cost = parseFloat(formData.cost)

      if (isNaN(currentStock) || currentStock < 0) {
        toast.error("Please enter a valid current stock")
        return
      }

      if (isNaN(minStockAlert) || minStockAlert < 0) {
        toast.error("Please enter a valid minimum stock alert")
        return
      }

      if (isNaN(cost) || cost < 0) {
        toast.error("Please enter a valid cost")
        return
      }

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        unit: formData.unit,
        currentStock,
        minStockAlert,
        cost,
        supplier: formData.supplier.trim()
      }

      if (editingItem) {
        await updateInventoryItem(restaurantName, editingItem.id, itemData)
        toast.success("Inventory item updated successfully!")
        setIsEditDialogOpen(false)
        setEditingItem(null)
      } else {
        await addInventoryItem(restaurantName, itemData)
        toast.success("Inventory item added successfully!")
        setIsAddDialogOpen(false)
      }

      resetForm()
    } catch (error) {
      console.error('Error saving inventory item:', error)
      toast.error("Failed to save inventory item")
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      currentStock: item.currentStock.toString(),
      minStockAlert: item.minStockAlert.toString(),
      cost: item.cost.toString(),
      supplier: item.supplier || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!restaurantName) return
    try {
      await deleteInventoryItem(restaurantName, itemId)
      toast.success("Inventory item deleted successfully!")
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      toast.error("Failed to delete inventory item")
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      unit: '',
      currentStock: '',
      minStockAlert: '',
      cost: '',
      supplier: ''
    })
  }

  const handleManageIngredients = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem)
    setIngredients(menuItem.ingredients || [])
    setIsIngredientsDialogOpen(true)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: '', name: '', quantity: 0, unit: '' }])
  }

  const updateIngredient = (index: number, field: keyof MenuItemIngredient, value: string | number) => {
    const updated = [...ingredients]
    if (field === 'inventoryItemId' && typeof value === 'string') {
      const inventoryItem = inventoryItems.find(item => item.id === value)
      if (inventoryItem) {
        updated[index] = {
          ...updated[index],
          inventoryItemId: value,
          name: inventoryItem.name,
          unit: inventoryItem.unit
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setIngredients(updated)
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const saveIngredients = async () => {
    if (!restaurantName || !selectedMenuItem) return

    try {
      const validIngredients = ingredients.filter(ing => ing.inventoryItemId && ing.quantity > 0)
      await updateMenuItemIngredients(restaurantName, selectedMenuItem.id, validIngredients)
      toast.success("Menu item ingredients updated successfully!")
      setIsIngredientsDialogOpen(false)
    } catch (error) {
      console.error('Error updating ingredients:', error)
      toast.error("Failed to update ingredients")
    }
  }

  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockAlert)
  const outOfStockItems = inventoryItems.filter(item => item.currentStock === 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's inventory and track stock levels
          </p>
        </div>
        <div className="flex gap-2">
          {isPremium && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
          {isPremium && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Crown className="h-3 w-3 mr-1" />
              Premium Feature
            </Badge>
          )}
        </div>
      </div>

      {!isPremium ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Feature</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Inventory management is available for premium subscribers. 
                Upgrade your plan to access advanced inventory tracking and management features.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>📦 <strong>Track:</strong> Inventory levels and stock alerts</p>
                <p>🔄 <strong>Manage:</strong> Ingredients for menu items</p>
                <p>📊 <strong>Monitor:</strong> Stock usage and costs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !isInventoryApproved ? (
        <Card className="border-2 border-dashed border-orange-300">
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-12 w-12 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pending Approval</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your inventory management feature is pending approval. 
                Please contact support to enable this feature for your restaurant.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>⏳ <strong>Status:</strong> Waiting for admin approval</p>
                <p>📞 <strong>Contact:</strong> Reach out to support for activation</p>
                <p>🚀 <strong>Soon:</strong> Full inventory management capabilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryItems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.cost), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage your restaurant's inventory items and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Min Alert</TableHead>
                      <TableHead>Cost/Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.currentStock}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.minStockAlert}</TableCell>
                        <TableCell>₹{item.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {item.currentStock === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : item.currentStock <= item.minStockAlert ? (
                            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory items found</p>
                  <p className="text-sm">Add your first inventory item to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Menu Items with Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Menu Items Ingredients</CardTitle>
              <CardDescription>Define ingredients for your menu items to track usage</CardDescription>
            </CardHeader>
            <CardContent>
              {menuItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Ingredients</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">₹{item.price}</div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          {item.ingredients && item.ingredients.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.ingredients.map((ingredient, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">No ingredients defined</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageIngredients(item)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Manage Ingredients
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No menu items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Inventory Item Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setEditingItem(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the inventory item details.' : 'Add a new item to your inventory.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Chicken Patty"
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="minStockAlert">Min Alert *</Label>
                <Input
                  id="minStockAlert"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minStockAlert}
                  onChange={(e) => setFormData({...formData, minStockAlert: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost/Unit *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                placeholder="Supplier name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false)
                setIsEditDialogOpen(false)
                setEditingItem(null)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Ingredients Dialog */}
      <Dialog open={isIngredientsDialogOpen} onOpenChange={setIsIngredientsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Manage Ingredients - {selectedMenuItem?.name}</DialogTitle>
            <DialogDescription>
              Define the ingredients needed to make this menu item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label>Inventory Item</Label>
                  <Select
                    value={ingredient.inventoryItemId}
                    onValueChange={(value) => updateIngredient(index, 'inventoryItemId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="col-span-3">
                  <Label>Unit</Label>
                  <Input
                    value={ingredient.unit}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addIngredient} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsIngredientsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveIngredients}>
              Save Ingredients
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 