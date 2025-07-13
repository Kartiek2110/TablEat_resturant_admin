'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, DollarSign, ShoppingCart, Users, Star, Calendar, Clock, ChefHat, BarChart as BarChartIcon, Percent, CreditCard, TrendingDown, ArrowUp, ArrowDown, Download, FileSpreadsheet } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts'
import { 
  subscribeToOrders,
  subscribeToMenuItems,
  getOrderAnalytics,
  getOrderAnalyticsWithDateFilter,
  type Order,
  type MenuItem 
} from '@/firebase/restaurant-service-optimized'
import { toast } from 'sonner'

type DateRange = 'today' | '1week' | '1month' | '6months' | '1year' | 'custom'

export default function AnalyticsPage() {
  const { restaurantName } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMenuItem, setSelectedMenuItem] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('1week')
  const [isExporting, setIsExporting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Set default to 1 week
    handleDateRangeChange('1week')
  }, [])

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

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range)
    const now = new Date()
    let start: Date | undefined
    let end: Date | undefined

    switch (range) {
      case 'today':
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setHours(23, 59, 59, 999)
        break
      case '1week':
        start = new Date(now)
        start.setDate(now.getDate() - 7)
        end = new Date(now)
        break
      case '1month':
        start = new Date(now)
        start.setMonth(now.getMonth() - 1)
        end = new Date(now)
        break
      case '6months':
        start = new Date(now)
        start.setMonth(now.getMonth() - 6)
        end = new Date(now)
        break
      case '1year':
        start = new Date(now)
        start.setFullYear(now.getFullYear() - 1)
        end = new Date(now)
        break
      case 'custom':
        // Keep existing custom dates
        return
    }

    if (start && end) {
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  const getDateRangeLabel = () => {
    switch (selectedDateRange) {
      case 'today':
        return 'Today'
      case '1week':
        return 'Last 7 Days'
      case '1month':
        return 'Last 30 Days'
      case '6months':
        return 'Last 6 Months'
      case '1year':
        return 'Last 12 Months'
      case 'custom':
        return 'Custom Range'
      default:
        return 'Select Range'
    }
  }

  // Calculate analytics data
  const analytics = startDate && endDate 
    ? getOrderAnalyticsWithDateFilter(
        orders, 
        menuItems, 
        new Date(startDate),
        new Date(endDate),
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

  // Export functions
  const exportAnalyticsSummary = async () => {
    if (totalOrders === 0) {
      toast.error("No data to export")
      return
    }

    setIsExporting(true)
    try {
      const XLSX = await import('xlsx')
      
      // Summary data
      const summaryData = [
        { Metric: 'Total Revenue', Value: `₹${totalRevenue.toFixed(2)}`, Period: getDateRangeLabel() },
        { Metric: 'Average Order Value', Value: `₹${averageOrderValue.toFixed(2)}`, Period: getDateRangeLabel() },
        { Metric: 'Total Orders', Value: totalOrders, Period: getDateRangeLabel() },
        { Metric: 'Completed Orders', Value: completedOrders, Period: getDateRangeLabel() },
        { Metric: 'Pending Orders', Value: pendingOrders, Period: getDateRangeLabel() },
        { Metric: 'Success Rate', Value: `${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%`, Period: getDateRangeLabel() },
        { Metric: 'Top Category', Value: categoryChartData.length > 0 ? categoryChartData[0].category : 'N/A', Period: getDateRangeLabel() },
        { Metric: 'Preferred Payment', Value: paymentMethodChartData.length > 0 ? paymentMethodChartData[0].method.toUpperCase() : 'N/A', Period: getDateRangeLabel() }
      ]

      // Popular items data
      const popularItemsData = popularItems.slice(0, 20).map((item, index) => ({
        Rank: index + 1,
        'Item Name': item.name,
        'Quantity Sold': item.quantity,
        'Revenue': `₹${item.revenue.toFixed(2)}`,
        'Average Price': `₹${(item.revenue / item.quantity).toFixed(2)}`
      }))

      // Daily revenue data
      const dailyRevenueData = dailyRevenue.map(day => ({
        Date: day.date,
        Revenue: `₹${day.revenue.toFixed(2)}`,
        Orders: day.orders
      }))

      // Category breakdown
      const categoryData = categoryChartData.map(cat => ({
        Category: cat.category,
        Revenue: `₹${cat.revenue.toFixed(2)}`,
        'Items Sold': cat.count
      }))

      // Payment methods
      const paymentData = paymentMethodChartData.map(payment => ({
        'Payment Method': payment.method.toUpperCase(),
        'Total Orders': payment.count,
        'Revenue': `₹${payment.revenue.toFixed(2)}`
      }))

      // Order sources
      const orderSourceData = orderSourceChartData.map(source => ({
        'Order Source': source.source,
        'Total Orders': source.count,
        'Revenue': `₹${source.revenue.toFixed(2)}`
      }))

      // Create workbook
      const workbook = XLSX.utils.book_new()
      
      // Add sheets
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      const popularItemsSheet = XLSX.utils.json_to_sheet(popularItemsData)
      const dailyRevenueSheet = XLSX.utils.json_to_sheet(dailyRevenueData)
      const categorySheet = XLSX.utils.json_to_sheet(categoryData)
      const paymentSheet = XLSX.utils.json_to_sheet(paymentData)
      const orderSourceSheet = XLSX.utils.json_to_sheet(orderSourceData)

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, popularItemsSheet, 'Popular Items')
      XLSX.utils.book_append_sheet(workbook, dailyRevenueSheet, 'Daily Revenue')
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categories')
      XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Methods')
      XLSX.utils.book_append_sheet(workbook, orderSourceSheet, 'Order Sources')

      // Generate filename
      const dateRange = startDate && endDate 
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0]
      
      const filename = `analytics_${restaurantName}_${dateRange}.xlsx`
      
      // Save file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Analytics exported successfully as ${filename}`)
    } catch (error) {
      console.error('Error exporting analytics:', error)
      toast.error('Failed to export analytics. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportPopularItems = async () => {
    if (popularItems.length === 0) {
      toast.error("No popular items data to export")
      return
    }

    setIsExporting(true)
    try {
      const XLSX = await import('xlsx')
      
      const data = popularItems.map((item, index) => ({
        Rank: index + 1,
        'Item Name': item.name,
        'Quantity Sold': item.quantity,
        'Revenue': `₹${item.revenue.toFixed(2)}`,
        'Average Price': `₹${(item.revenue / item.quantity).toFixed(2)}`,
        'Period': getDateRangeLabel()
      }))

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Popular Items')

      const filename = `popular_items_${restaurantName}_${getDateRangeLabel().replace(/\s+/g, '_')}.xlsx`
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Popular items exported successfully!`)
    } catch (error) {
      console.error('Error exporting popular items:', error)
      toast.error('Failed to export popular items.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportDailyRevenue = async () => {
    if (dailyRevenue.length === 0) {
      toast.error("No daily revenue data to export")
      return
    }

    setIsExporting(true)
    try {
      const XLSX = await import('xlsx')
      
      const data = dailyRevenue.map(day => ({
        Date: day.date,
        Revenue: `₹${day.revenue.toFixed(2)}`,
        'Number of Orders': day.orders,
        'Average Order Value': day.orders > 0 ? `₹${(day.revenue / day.orders).toFixed(2)}` : '₹0.00',
        'Period': getDateRangeLabel()
      }))

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Revenue')

      const filename = `daily_revenue_${restaurantName}_${getDateRangeLabel().replace(/\s+/g, '_')}.xlsx`
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Daily revenue exported successfully!`)
    } catch (error) {
      console.error('Error exporting daily revenue:', error)
      toast.error('Failed to export daily revenue.')
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate comparison with previous period
  const calculatePeriodComparison = () => {
    if (!startDate || !endDate) return null

    const currentStart = new Date(startDate)
    const currentEnd = new Date(endDate)
    const periodLength = currentEnd.getTime() - currentStart.getTime()
    
    const previousStart = new Date(currentStart.getTime() - periodLength)
    const previousEnd = new Date(currentStart)

    const previousAnalytics = getOrderAnalyticsWithDateFilter(
      orders,
      menuItems,
      previousStart,
      previousEnd
    )

    const revenueChange = totalRevenue - previousAnalytics.totalRevenue
    const revenueChangePercent = previousAnalytics.totalRevenue > 0 
      ? ((revenueChange / previousAnalytics.totalRevenue) * 100)
      : 0

    const ordersChange = completedOrders - previousAnalytics.completedOrders
    const ordersChangePercent = previousAnalytics.completedOrders > 0
      ? ((ordersChange / previousAnalytics.completedOrders) * 100)
      : 0

    return {
      revenue: { change: revenueChange, percent: revenueChangePercent },
      orders: { change: ordersChange, percent: ordersChangePercent }
    }
  }

  const periodComparison = calculatePeriodComparison()

  // Calculate hourly distribution
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, revenue: 0 }))
  const filteredOrders = startDate && endDate 
    ? orders.filter(order => {
        const orderDate = order.createdAt
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
      })
    : orders

  filteredOrders.filter(order => order.status === 'served').forEach(order => {
    const hour = order.createdAt.getHours()
    hourlyData[hour].orders += 1
    hourlyData[hour].revenue += order.totalAmount
  })

  const hourlyChartData = hourlyData.map(data => ({
    hour: `${data.hour}:00`,
    orders: data.orders,
    revenue: data.revenue
  })).filter(data => data.orders > 0 || data.revenue > 0)

  // Calculate order status distribution
  const statusData = [
    { status: 'Completed', count: completedOrders, color: '#10B981' },
    { status: 'Pending', count: pendingOrders, color: '#F59E0B' },
    { status: 'Cancelled', count: filteredOrders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
  ].filter(item => item.count > 0)

  const handleApplyFilters = () => {
    // Filters are applied automatically through the analytics calculation
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedMenuItem('')
    setSelectedDateRange('1week')
    handleDateRangeChange('1week')
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300']

  if (!isMounted) {
    return null
  }

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track your restaurant's performance and growth over time
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button
              onClick={exportAnalyticsSummary}
              disabled={isExporting || totalOrders === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Full Report'}
            </Button>
            <Button
              onClick={exportPopularItems}
              disabled={isExporting || popularItems.length === 0}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Items
            </Button>
            <Button
              onClick={exportDailyRevenue}
              disabled={isExporting || dailyRevenue.length === 0}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Revenue
            </Button>
          </div>
        </div>
        
        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Date Range</CardTitle>
            <CardDescription>Select a time period to analyze your restaurant's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Date Range Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'today', label: 'Today' },
                  { key: '1week', label: '1 Week' },
                  { key: '1month', label: '1 Month' },
                  { key: '6months', label: '6 Months' },
                  { key: '1year', label: '1 Year' },
                  { key: 'custom', label: 'Custom' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={selectedDateRange === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateRangeChange(key as DateRange)}
                    className={selectedDateRange === key ? 'bg-blue-600 text-white' : ''}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Custom Date Range */}
              {selectedDateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                  <Button onClick={handleApplyFilters} className="h-10">
                    Apply Range
                  </Button>
                </div>
              )}

              {/* Menu Item Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor="menuItem">Filter by Menu Item (Optional)</Label>
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
                  {(selectedMenuItem || selectedDateRange === 'custom') && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Current Selection Display */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Analyzing: {getDateRangeLabel()}</span>
                  {startDate && endDate && (
                    <span className="text-sm">
                      ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})
                    </span>
                  )}
                  {selectedMenuItem && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                      Item: {menuItems.find(item => item.id === selectedMenuItem)?.name || 'Unknown'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <BarChartIcon className="h-12 w-12 text-purple-600" />
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
          {/* Key Metrics with Comparison */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {periodComparison && (
                  <div className="flex items-center mt-1">
                    {periodComparison.revenue.change >= 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${periodComparison.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {periodComparison.revenue.percent.toFixed(1)}% vs previous period
                    </span>
                  </div>
                )}
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
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {completedOrders} completed, {pendingOrders} pending
                </p>
                {periodComparison && (
                  <div className="flex items-center mt-1">
                    {periodComparison.orders.change >= 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${periodComparison.orders.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {periodComparison.orders.percent.toFixed(1)}% vs previous period
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Orders completed successfully
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend - {getDateRangeLabel()}</CardTitle>
                <CardDescription>Daily revenue and order count over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `₹${value.toFixed(2)}` : value, 
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, value }) => `${category}: ₹${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Order Sources</CardTitle>
                <CardDescription>Revenue from different order channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderSourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, revenue }) => `${source}: ₹${revenue.toFixed(0)}`}
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
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Hourly Distribution */}
            {hourlyChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Order Distribution</CardTitle>
                  <CardDescription>Peak hours analysis for selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Order completion status for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }: { status: string; count: number }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusData.map((entry: { status: string; count: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Popular Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Menu Items - {getDateRangeLabel()}</CardTitle>
              <CardDescription>Top performing items by quantity and revenue for selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularItems.slice(0, 10).map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.revenue.toFixed(2)}</TableCell>
                      <TableCell>₹{(item.revenue / item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {categoryChartData.length > 0 ? categoryChartData[0].category : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryChartData.length > 0 ? `₹${categoryChartData[0].revenue.toFixed(2)} revenue` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preferred Payment</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paymentMethodChartData.length > 0 ? paymentMethodChartData[0].method.toUpperCase() : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentMethodChartData.length > 0 ? `${paymentMethodChartData[0].count} orders` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hourlyChartData.length > 0 
                    ? hourlyChartData.reduce((max, current) => current.orders > max.orders ? current : max, hourlyChartData[0]).hour
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {hourlyChartData.length > 0 
                    ? `${hourlyChartData.reduce((max, current) => current.orders > max.orders ? current : max, hourlyChartData[0]).orders} orders`
                    : 'No data'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}