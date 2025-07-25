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
  subscribeToCustomers,
  createOrder,
  getRestaurantByAdminEmail,
  getCustomerByPhone,
  type MenuItem,
  type Table,
  type OrderItem,
  type Restaurant,
  type Customer
} from '@/firebase/restaurant-service'
import { toast } from "sonner"

interface CartItem extends OrderItem {
  menuItem: MenuItem
}

export default function QuickOrderPage() {
  const { restaurantName, user } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [orderType, setOrderType] = useState<'dine-in' | 'pickup'>('dine-in')
  const [notes, setNotes] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribeMenu = subscribeToMenuItems(restaurantName, (items) => {
      setMenuItems(items)
      setLoading(false)
    })

    const unsubscribeTables = subscribeToTables(restaurantName, (tables) => {
      setTables(tables)
    })

    const unsubscribeCustomers = subscribeToCustomers(restaurantName, (customers) => {
      setCustomers(customers)
    })

    // Fetch restaurant data
    const fetchRestaurant = async () => {
      if (user?.email) {
        try {
          const restaurantData = await getRestaurantByAdminEmail(user.email)
          setRestaurant(restaurantData)
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        }
      }
    }
    fetchRestaurant()

    return () => {
      unsubscribeMenu()
      unsubscribeTables()
      unsubscribeCustomers()
    }
  }, [restaurantName, user?.email])

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

  // Sort by price (lowest first)
  filteredItems = filteredItems.sort((a, b) => a.price - b.price)

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
    const tax = restaurant?.taxEnabled && restaurant?.taxRate 
      ? (subtotal * restaurant.taxRate) / 100 
      : 0
    return subtotal + tax
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTax = () => {
    const subtotal = getSubtotal()
    return restaurant?.taxEnabled && restaurant?.taxRate 
      ? (subtotal * restaurant.taxRate) / 100 
      : 0
  }

  // Function to generate daily order number
  const generateDailyOrderNumber = () => {
    const today = new Date().toDateString();
    const storageKey = `daily_order_${restaurantName}_${today}`;
    
    let currentOrderNumber = parseInt(localStorage.getItem(storageKey) || '0');
    currentOrderNumber += 1;
    
    localStorage.setItem(storageKey, currentOrderNumber.toString());
    return currentOrderNumber;
  };

  const handleCreateOrder = async () => {
    if (!restaurantName || cart.length === 0) {
      toast.error('Please add items to cart before creating order')
      return
    }

    try {
      setCreating(true)

      const dailyOrderNumber = generateDailyOrderNumber();

      const orderData = {
        customerName: customerName.trim() || `Order #${dailyOrderNumber}`,
        customerPhone: customerPhone.trim() || '',
        tableNumber: orderType === 'pickup' ? 0 : (selectedTable ? parseInt(selectedTable) : 0),
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
        orderSource: 'quick_order' as const,
        orderType: orderType,
        dailyOrderNumber: dailyOrderNumber
      }

      await createOrder(restaurantName, orderData)
      
      // Reset form
      setCustomerName('')
      setCustomerPhone('')
      setSelectedTable('')
      setOrderType('dine-in')
      setNotes('')
      setCart([])
      setSelectedCustomer(null)
      setCustomerSearchTerm('')
      setShowCustomerSuggestions(false)
      
      toast.success(`${orderType === 'pickup' ? 'Pickup' : 'Dine-in'} Order #${dailyOrderNumber} created successfully!`)
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    } finally {
      setCreating(false)
    }
  }

  // Customer selection handlers
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone)
    setCustomerSearchTerm('')
    setShowCustomerSuggestions(false)
    toast.success(`Selected customer: ${customer.name} 👋`)
  }

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchTerm(value)
    setShowCustomerSuggestions(value.length > 0)
    
    // If user is typing a new customer, clear selection
    if (selectedCustomer && value !== selectedCustomer.name) {
      setSelectedCustomer(null)
      setCustomerName(value)
      setCustomerPhone('')
    }
  }

  const clearCustomerSelection = () => {
    setSelectedCustomer(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerSearchTerm('')
    setShowCustomerSuggestions(false)
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  ).slice(0, 5) // Limit to 5 suggestions

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (target && !target.closest('.customer-suggestions-container')) {
        setShowCustomerSuggestions(false)
      }
    }

    if (showCustomerSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCustomerSuggestions])

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Quick Order</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Take customer orders quickly at reception
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <Utensils className="h-3 w-3 mr-1" />
            {menuItems.length} items available
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Menu Selection */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          {/* Category Filter */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Menu Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs px-2 py-1 h-7 sm:h-8 sm:px-3"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Search Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="text-xs h-8 px-3 w-full sm:w-auto"
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
                <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
                  {filteredItems.map((item) => {
                    const cartItem = cart.find(c => c.menuItemId === item.id)
                    const isInCart = Boolean(cartItem)
                    
                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                          isInCart 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => addToCart(item)}
                      >
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
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
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Customer Details</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All fields are optional. Orders get auto-numbered daily (1, 2, 3...).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderType" className="text-sm">Order Type *</Label>
                <Select value={orderType} onValueChange={(value: 'dine-in' | 'pickup') => setOrderType(value)}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select order type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">🍽️ Dine-In</SelectItem>
                    <SelectItem value="pickup">📦 Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="customer-suggestions-container space-y-2 relative">
                <Label htmlFor="customerName" className="text-sm">Customer Name (Optional)</Label>
                <div className="relative">
                  <Input
                    id="customerName"
                    value={customerSearchTerm || customerName}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    onFocus={() => {
                      if (customers.length > 0) {
                        setShowCustomerSuggestions(true)
                      }
                    }}
                    placeholder={customers.length > 0 ? "Search existing customers or enter new name" : "Enter customer name"}
                    className="text-sm sm:text-base"
                  />
                  {selectedCustomer && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCustomerSelection}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </Button>
                  )}
                </div>
                
                {/* Customer Suggestions Dropdown */}
                {showCustomerSuggestions && (
                  <div className="customer-suggestions-container absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      <>
                        <div className="p-2 text-xs text-gray-500 border-b">
                          Select from existing customers ({customers.length} total)
                        </div>
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleCustomerSelect(customer)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{customer.name}</div>
                                <div className="text-xs text-gray-500">📞 {customer.phone}</div>
                              </div>
                              <div className="text-xs text-gray-400 ml-2">
                                {customer.totalOrders} orders
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : customerSearchTerm ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No customers found. You can enter a new customer name.
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No customers in database yet. Add new customer details to start building your customer base.
                      </div>
                    ) : null}
                  </div>
                )}
                
                {selectedCustomer && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    ✅ Selected: {selectedCustomer.name} ({selectedCustomer.totalOrders} previous orders)
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number (optional)"
                  className="text-sm sm:text-base"
                />
              </div>

              {orderType === 'dine-in' && (
                <div className="space-y-2">
                  <Label htmlFor="table" className="text-sm">Table Selection (Optional)</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select table (optional)" />
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
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm">Special Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  rows={2}
                  className="text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Order Summary</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-4 sm:py-6 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No items in cart</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-xs sm:text-sm truncate">{item.name}</h5>
                        <p className="text-xs text-gray-600">₹{item.price} each</p>
                        <p className="text-xs font-medium text-green-600">
                          Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                        <span className="text-xs sm:text-sm font-bold min-w-[1.5rem] sm:min-w-[2.5rem] text-center bg-white px-1 sm:px-2 py-1 rounded">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (18%):</span>
                      <span>₹{getTax().toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-sm sm:text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateOrder}
                    disabled={creating || cart.length === 0}
                    className="w-full mt-3 sm:mt-4 text-sm sm:text-base h-10 sm:h-11"
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