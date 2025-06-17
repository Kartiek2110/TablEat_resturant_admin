'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  Receipt, 
  Utensils,
  Clock,
  DollarSign,
  Check,
  Search
} from "lucide-react"
import {
  subscribeToMenuItems,
  subscribeToTables,
  createOrder,
  type MenuItem,
  type Table,
  type OrderItem
} from '@/firebase/restaurant-service'
import { toast } from "sonner"

interface CartItem extends OrderItem {
  menuItem: MenuItem
}

export default function QuickOrderPage() {
  const { restaurantName } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [notes, setNotes] = useState('')
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribeMenu = subscribeToMenuItems(restaurantName, (items) => {
      setMenuItems(items.filter(item => item.available))
      setLoading(false)
    })

    const unsubscribeTables = subscribeToTables(restaurantName, (tableData) => {
      setTables(tableData.filter(table => !table.occupied))
    })

    return () => {
      unsubscribeMenu()
      unsubscribeTables()
    }
  }, [restaurantName])

  const categories = ['All', ...new Set(menuItems.map(item => item.category))]
  
  // Filter items by category and search term
  let filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)
  
  // Apply search filter
  if (searchTerm.trim()) {
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItemId === menuItem.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        menuItem
      }])
    }
  }

  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.menuItemId !== menuItemId))
    } else {
      setCart(cart.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const getTotalAmount = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    const tax = subtotal * 0.18 // 18% GST
    return subtotal + tax
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTax = () => {
    return getSubtotal() * 0.18
  }

  const handleCreateOrder = async () => {
    if (!restaurantName || !customerName.trim() || !customerPhone.trim() || !selectedTable || cart.length === 0) {
      toast.error('Please fill all required fields and add items to cart')
      return
    }

    try {
      setCreating(true)

      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        tableNumber: parseInt(selectedTable),
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: ''
        })),
        status: 'pending' as const,
        totalAmount: getTotalAmount(),
        notes: notes.trim(),
        orderSource: 'quick_order' as const
      }

      await createOrder(restaurantName, orderData)
      
      // Reset form
      setCustomerName('')
      setCustomerPhone('')
      setSelectedTable('')
      setNotes('')
      setCart([])
      
      toast.success('Order created successfully!')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Order</h1>
          <p className="text-muted-foreground">
            Take customer orders quickly at reception
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Utensils className="h-3 w-3 mr-1" />
            {menuItems.length} items available
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Menu Selection */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Menu Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Search Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search items by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mt-2">
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Utensils className="h-5 w-5" />
                <span>Menu Items</span>
                {searchTerm && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Filtered by: "{searchTerm}"
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Click items to add to order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {searchTerm ? <Search className="h-8 w-8" /> : <Utensils className="h-8 w-8" />}
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {searchTerm ? 'No items found' : 'No items available'}
                  </p>
                  <p className="text-sm">
                    {searchTerm 
                      ? `No menu items match "${searchTerm}". Try adjusting your search.`
                      : selectedCategory === 'All' 
                        ? 'No menu items available at the moment.'
                        : `No items available in ${selectedCategory} category.`
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => {
                    const cartItem = cart.find(c => c.menuItemId === item.id)
                    const isInCart = Boolean(cartItem)
                    
                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          isInCart 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => addToCart(item)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {item.isBestSeller && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                  ⭐ Best
                                </Badge>
                              )}
                            </div>
                            </div>
                            {isInCart && cartItem && (
                              <div className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                {cartItem.quantity}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ₹{item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className={`w-full ${isInCart ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(item)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {isInCart ? 'Add More' : 'Add to Cart'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table">Table Selection *</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select table option" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.length === 0 ? (
                      <>
                        <SelectItem value="will-assign">
                          Will assign table later
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        {tables.map((table) => (
                          <SelectItem key={table.id} value={table.tableNumber.toString()}>
                            🟢 Table {table.tableNumber} (Seats {table.capacity})
                          </SelectItem>
                        ))}
                        <SelectItem value="will-assign">
                          Will assign table later
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {tables.length > 0 ? (
                  <p className="text-xs text-green-600">
                    {tables.length} table{tables.length > 1 ? 's' : ''} available
                  </p>
                ) : (
                  <p className="text-xs text-yellow-600">
                    No tables currently available
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Order Summary</span>
                </div>
                <Badge variant="secondary">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in cart</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{item.name}</h5>
                        <p className="text-xs text-gray-600">₹{item.price} each</p>
                        <p className="text-xs font-medium text-green-600">
                          Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold min-w-[2.5rem] text-center bg-white px-2 py-1 rounded">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>₹{getTax().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateOrder}
                    disabled={creating || !customerName || !customerPhone || !selectedTable}
                    className="w-full mt-4"
                  >
                    {creating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Order...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Receipt className="h-4 w-4 mr-2" />
                        Create Order
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 