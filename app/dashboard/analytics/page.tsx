'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, ShoppingCart, Users, Star, Calendar, Clock, ChefHat } from "lucide-react"
import { 
  subscribeToOrders,
  subscribeToMenuItems,
  getOrderAnalytics,
  getOrderAnalyticsWithDateFilter,
  type Order,
  type MenuItem 
} from '@/firebase/restaurant-service'

export default function AnalyticsPage() {
  const { restaurantName } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMenuItem, setSelectedMenuItem] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    if (!restaurantName) return

    let ordersLoaded = false
    let menuLoaded = false

    const checkLoading = () => {
      if (ordersLoaded && menuLoaded) {
        setLoading(false)
      }
    }

    const unsubscribeOrders = subscribeToOrders(restaurantName, (orderData) => {
      setOrders(orderData)
      ordersLoaded = true
      checkLoading()
    })

    const unsubscribeMenu = subscribeToMenuItems(restaurantName, (menuData) => {
      setMenuItems(menuData)
      menuLoaded = true
      checkLoading()
    })

    return () => {
      unsubscribeOrders()
      unsubscribeMenu()
    }
  }, [restaurantName])

  // Calculate analytics data using the centralized function with optional filtering
  const analytics = isFiltering 
    ? getOrderAnalyticsWithDateFilter(
        orders, 
        menuItems, 
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        selectedMenuItem || undefined
      )
    : getOrderAnalytics(orders, menuItems)
    
  const { 
    totalRevenue, 
    averageOrderValue, 
    popularItems, 
    dailyRevenue, 
    categoryChartData,
    paymentMethodChartData,
    orderSourceChartData,
    completedOrders,
    pendingOrders,
    totalOrders
  } = analytics

  const handleApplyFilters = () => {
    if (startDate || endDate || selectedMenuItem) {
      setIsFiltering(true)
    } else {
      setIsFiltering(false)
    }
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedMenuItem('')
    setIsFiltering(false)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your restaurant
          </p>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter analytics by date range and menu items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="menuItem">Menu Item</Label>
                <select
                  id="menuItem"
                  value={selectedMenuItem}
                  onChange={(e) => setSelectedMenuItem(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">All Menu Items</option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
                {(startDate || endDate || selectedMenuItem) && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {isFiltering && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                    Filtered Results
                  </Badge>
                  <span className="text-sm">
                    {startDate && `From: ${new Date(startDate).toLocaleDateString()}`}
                    {startDate && endDate && ' | '}
                    {endDate && `To: ${new Date(endDate).toLocaleDateString()}`}
                    {selectedMenuItem && ` | Item: ${menuItems.find(item => item.id === selectedMenuItem)?.name || 'Unknown'}`}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {completedOrders} completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per completed order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {menuItems.filter(item => item.available).length} available
            </p>
          </CardContent>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <BarChart className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your analytics will show here once you start receiving orders. 
                Get ready to track your restaurant's success! 📊
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>📈 <strong>Track:</strong> Revenue, popular items, and customer trends</p>
                <p>🎯 <strong>Optimize:</strong> Menu performance and pricing strategies</p>
                <p>🚀 <strong>Grow:</strong> Make data-driven business decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
                <CardDescription>Revenue and order count by day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `₹${value}` : value, 
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Sales distribution across menu categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Method and Order Source Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodChartData && paymentMethodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percent }) => `${method.toUpperCase()} ${(percent * 100).toFixed(2)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {paymentMethodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />  
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No payment method data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Sources</CardTitle>
                <CardDescription>Revenue from Quick Orders vs Regular Orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orderSourceChartData && orderSourceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderSourceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(2)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {orderSourceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    No order source data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Method and Order Source Stats Tables */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Method Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Statistics</CardTitle>
                <CardDescription>Detailed breakdown of payment preferences</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodChartData && paymentMethodChartData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentMethodChartData.map((method, index) => (
                        <TableRow key={method.method}>
                          <TableCell className="font-medium">
                            {method.method.toUpperCase()}
                          </TableCell>
                          <TableCell>{method.count}</TableCell>
                          <TableCell>₹{method.revenue.toFixed(2)}</TableCell>
                          <TableCell>₹{(method.revenue / method.count).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment method data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Source Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Order Source Statistics</CardTitle>
                <CardDescription>Performance comparison between order channels</CardDescription>
              </CardHeader>
              <CardContent>
                {orderSourceChartData && orderSourceChartData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Source</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderSourceChartData.map((source, index) => (
                        <TableRow key={source.sourceKey}>
                          <TableCell className="font-medium">
                            {source.source}
                          </TableCell>
                          <TableCell>{source.count}</TableCell>
                          <TableCell>₹{source.revenue.toFixed(2)}</TableCell>
                          <TableCell>₹{(source.revenue / source.count).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No order source data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Popular Items */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Menu Items</CardTitle>
              <CardDescription>Best-selling items based on completed orders</CardDescription>
            </CardHeader>
            <CardContent>
              {popularItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity} sold</TableCell>
                        <TableCell>₹{item.revenue.toFixed(2)}</TableCell> 
                        <TableCell>
                          {index === 0 && <Badge className="bg-yellow-100 text-yellow-800">🏆 Top Seller</Badge>}
                          {index === 1 && <Badge className="bg-gray-100 text-gray-800">🥈 Runner Up</Badge>}
                          {index === 2 && <Badge className="bg-orange-100 text-orange-800">🥉 Third Place</Badge>}
                          {index > 2 && <Badge variant="outline">Popular</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
