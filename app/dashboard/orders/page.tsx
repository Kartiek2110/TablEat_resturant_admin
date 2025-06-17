'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import OrderDetailsDialog from '@/components/OrderDetailsDialog'
import { ShoppingCart, Clock, CheckCircle, XCircle, ChefHat, TrendingUp, Users, DollarSign, Search, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  subscribeToOrders,
  type Order 
} from '@/firebase/restaurant-service'

export default function OrdersPage() {
  const { restaurantName } = useAuth()
  const { pendingOrders } = useNotifications()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribe = subscribeToOrders(restaurantName, (orderData) => {
      setOrders(orderData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [restaurantName])

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'preparing':
        return <ChefHat className="h-4 w-4 text-blue-500" />
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'served':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'served':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Enhanced timing calculation
  const getOrderTiming = (order: Order) => {
    const now = new Date()
    
    if (order.status === 'pending') {
      const minutesAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / 60000)
      const isUrgent = minutesAgo > 15 // Orders older than 15 minutes are urgent
      return {
        text: `${minutesAgo}m waiting`,
        isUrgent,
        urgencyLevel: minutesAgo > 30 ? 'critical' : minutesAgo > 15 ? 'warning' : 'normal'
      }
    } else if (order.status === 'served') {
      // Calculate total completion time
      const servedStatus = order.statusHistory?.find(s => s.status === 'served')
      if (servedStatus) {
        const totalMinutes = Math.floor((servedStatus.timestamp.getTime() - order.createdAt.getTime()) / 60000)
        return {
          text: `${totalMinutes}m total`,
          isUrgent: false,
          urgencyLevel: 'completed'
        }
      }
    } else if (order.status === 'preparing') {
      const preparingStatus = order.statusHistory?.find(s => s.status === 'preparing')
      if (preparingStatus) {
        const preparingMinutes = Math.floor((now.getTime() - preparingStatus.timestamp.getTime()) / 60000)
        return {
          text: `${preparingMinutes}m preparing`,
          isUrgent: preparingMinutes > 20,
          urgencyLevel: preparingMinutes > 25 ? 'critical' : preparingMinutes > 20 ? 'warning' : 'normal'
        }
      }
    } else if (order.status === 'ready') {
      const readyStatus = order.statusHistory?.find(s => s.status === 'ready')
      if (readyStatus) {
        const readyMinutes = Math.floor((now.getTime() - readyStatus.timestamp.getTime()) / 60000)
        return {
          text: `${readyMinutes}m ready`,
          isUrgent: readyMinutes > 5, // Food getting cold
          urgencyLevel: readyMinutes > 10 ? 'critical' : readyMinutes > 5 ? 'warning' : 'normal'
        }
      }
    }
    
    const minutesAgo = Math.floor((now.getTime() - order.updatedAt.getTime()) / 60000)
    return {
      text: `${minutesAgo}m ago`,
      isUrgent: false,
      urgencyLevel: 'normal'
    }
  }

  // Calculate statistics
  const todayOrders = orders.filter(order => {
    const today = new Date().toDateString()
    return order.createdAt.toDateString() === today
  })

  const totalRevenue = orders
    .filter(order => order.status === 'served')
    .reduce((sum, order) => sum + order.totalAmount, 0)

  const averageOrderValue = orders.length > 0 
    ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
    : 0

  // Filter orders based on search
  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone?.includes(searchTerm) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber.toString().includes(searchTerm) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track and manage all your restaurant orders in real-time
        </p>
      </div>

      {/* URGENT ORDERS ALERT */}
      {pendingOrders.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              🚨 URGENT: {pendingOrders.length} PENDING ORDER{pendingOrders.length > 1 ? 'S' : ''}!
            </CardTitle>
            <CardDescription className="text-red-600">
              These orders need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {pendingOrders.slice(0, 3).map((order) => {
                const timing = getOrderTiming(order)
                return (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="animate-pulse">
                        Table {order.tableNumber}
                      </Badge>
                      <div>
                        <p className="font-semibold text-red-800">{order.customerName}</p>
                        <p className="text-sm text-red-600">{order.items.length} items • ₹{order.totalAmount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`${
                          timing.urgencyLevel === 'critical' 
                            ? 'bg-red-100 text-red-800 border-red-300' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        {timing.text}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {pendingOrders.length > 3 && (
                <p className="text-sm text-red-600 text-center pt-2">
                  +{pendingOrders.length - 3} more pending orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders.length} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">₹{totalRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg Value</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">₹{averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Order History</CardTitle>
          <CardDescription className="text-sm">
            Complete history of all orders placed at your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4 sm:mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            {searchTerm && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
                      {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Your order history will appear here once customers start placing orders. 
                  Get ready to serve amazing food! 🍽️
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>💡 <strong>Tip:</strong> Share your menu with customers to get started</p>
                  <p>🚀 <strong>Pro tip:</strong> Great service leads to repeat customers</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No orders match your search criteria. Try adjusting your search terms.
                </p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Order ID</TableHead>
                    <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                    <TableHead className="text-xs sm:text-sm">Table</TableHead>
                    <TableHead className="text-xs sm:text-sm">Items</TableHead>
                    <TableHead className="text-xs sm:text-sm">Total</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Timing</TableHead>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const getOrderTiming = () => {
                      const now = new Date()
                      if (order.status === 'pending') {
                        const minutesAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / 60000)
                        return {
                          text: `${minutesAgo}m waiting`,
                          color: minutesAgo > 15 ? 'text-red-600' : minutesAgo > 10 ? 'text-yellow-600' : 'text-gray-600'
                        }
                      } else if (order.status === 'served') {
                        const servedStatus = order.statusHistory?.find(s => s.status === 'served')
                        if (servedStatus) {
                          const totalTime = Math.floor((servedStatus.timestamp.getTime() - order.createdAt.getTime()) / 60000)
                          return {
                            text: `${totalTime}m total`,
                            color: 'text-green-600'
                          }
                        }
                      }
                      const minutesAgo = Math.floor((now.getTime() - order.updatedAt.getTime()) / 60000)
                      return {
                        text: `${minutesAgo}m ago`,
                        color: 'text-gray-600'
                      }
                    }

                    const timing = getOrderTiming()

                    return (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleOrderClick(order)}
                      >
                        <TableCell className="font-medium text-xs sm:text-sm">
                          #{order.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            {order.customerPhone && (
                              <p className="text-xs text-gray-500">{order.customerPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <Badge variant="outline" className="text-xs">Table {order.tableNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{order.items.length - 2} more items
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm font-medium ${timing.color}`}>
                            {timing.text}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false)
          setSelectedOrder(null)
        }}
      />
    </div>
  )
}
