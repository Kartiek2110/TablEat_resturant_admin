'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import OrderDetailsDialog from '@/components/OrderDetailsDialog'
import { 
  ShoppingCart, 
  Users, 
  ChefHat, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import {
  createRestaurant,
  getRestaurantByAdminEmail,
  subscribeToOrders,
  subscribeToTables,
  subscribeToMenuItems,
  updateTableStatus,
  processIncomingOrder,
  syncTableStatusesWithOrders,
  type Order,
  type Table,
  type MenuItem,
  type Restaurant
} from '@/firebase/restaurant-service'
import SubscriptionStatus from '@/components/SubscriptionStatus'
import { NotificationList } from '@/components/notification-list'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user, restaurantName } = useAuth()
  const { orders, pendingOrders } = useNotifications()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

  // Use refs to track subscriptions
  const unsubscribeRefs = useRef<{
    tables?: () => void
    menu?: () => void
  }>({})

  // Optimized initialization with reduced subscriptions
  useEffect(() => {
    if (!user?.email || !restaurantName) return

    const initializeRestaurant = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check if restaurant exists
        let restaurantData = await getRestaurantByAdminEmail(user.email!)
        
        // If not, create it
        if (!restaurantData) {
          restaurantData = await createRestaurant(restaurantName, user.email!)
        }
        
        setRestaurant(restaurantData)

        // Only subscribe to tables and menu (orders handled by NotificationContext)
        const { subscribeToTables, subscribeToMenuItems } = await import('@/firebase/restaurant-service')

        // Tables subscription
        unsubscribeRefs.current.tables = subscribeToTables(restaurantName, (tableData) => {
          setTables(tableData)
        })

        // Menu subscription
        unsubscribeRefs.current.menu = subscribeToMenuItems(restaurantName, (menuData) => {
          setMenuItems(menuData)
        })

        setLoading(false)
      } catch (error) {
        console.error('Error initializing restaurant:', error)
        setError('Failed to initialize restaurant data')
        setLoading(false)
      }
    }

    initializeRestaurant()

    // Cleanup function
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe()
      })
      unsubscribeRefs.current = {}
    }
  }, [user?.email, restaurantName])

  // Auto-sync table statuses for pending orders
  useEffect(() => {
    if (!restaurantName || pendingOrders.length === 0) return

    const syncTableStatuses = async () => {
      try {
        await syncTableStatusesWithOrders(restaurantName)
      } catch (error) {
        console.error('Error syncing table statuses:', error)
      }
    }

    // Add a small delay to ensure all data is loaded
    const timer = setTimeout(syncTableStatuses, 1000)
    return () => clearTimeout(timer)
  }, [pendingOrders.length, restaurantName])

  // Memoized statistics calculation
  const statistics = useCallback(() => {
    const today = new Date().toDateString()
    const todayOrders = orders.filter(order => 
      order.createdAt.toDateString() === today
    )
    
    const occupiedTables = tables.filter(table => table.occupied)
    
    const todayRevenue = todayOrders.reduce((sum, order) => {
      return order.status === 'served' ? sum + order.totalAmount : sum
    }, 0)

    return {
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      occupiedTables: occupiedTables.length,
      totalTables: tables.length,
      todayRevenue,
      menuItems: menuItems.length
    }
  }, [orders, tables, pendingOrders, menuItems])

  const stats = statistics()

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Setting up restaurant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's what's happening at your restaurant.</p>
        </div>
        {stats.pendingOrders > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {stats.pendingOrders} Pending Orders
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">Total orders placed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting preparation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.occupiedTables}/{stats.totalTables}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTables > 0 ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0}% occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Latest activity and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationList />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>Your restaurant at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Menu Items</span>
              <Badge variant="outline">{stats.menuItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Tables</span>
              <Badge variant="outline">{stats.totalTables}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Restaurant Status</span>
              <Badge variant={restaurant.status === 'active' ? 'default' : 'secondary'}>
                {restaurant.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders from your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => {
                const getOrderTiming = () => {
                  const now = new Date()
                  if (order.status === 'pending') {
                    const minutesAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / 60000)
                    return `${minutesAgo}m ago`
                  } else if (order.status === 'served') {
                    const lastStatus = order.statusHistory?.find(s => s.status === 'served')
                    if (lastStatus) {
                      const totalTime = Math.floor((lastStatus.timestamp.getTime() - order.createdAt.getTime()) / 60000)
                      return `${totalTime}m total`
                    }
                  }
                  const minutesAgo = Math.floor((now.getTime() - order.updatedAt.getTime()) / 60000)
                  return `${minutesAgo}m ago`
                }

                return (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Table {order.tableNumber}</Badge>
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          ₹{order.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getOrderTiming()}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          order.status === 'pending' ? 'destructive' :
                          order.status === 'preparing' ? 'default' :
                          order.status === 'ready' ? 'secondary' :
                          'outline'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Status */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Table Status</CardTitle>
            <CardDescription>
              Current table occupancy - Click occupied tables to view order details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {tables.map((table) => {
                const handleTableClick = async () => {
                  if (table.occupied && table.currentOrderId) {
                    // Find the order associated with this table
                    const associatedOrder = orders.find(order => order.id === table.currentOrderId)
                    if (associatedOrder) {
                      handleOrderClick(associatedOrder)
                    } else {
                      toast.error('Order details not found')
                    }
                  }
                }

                return (
                  <div 
                    key={table.id} 
                    className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                      table.occupied 
                        ? 'bg-red-50 border-red-200 text-red-700 cursor-pointer hover:bg-red-100 hover:shadow-md transform hover:scale-105' 
                        : 'bg-green-50 border-green-200 text-green-700'
                    }`}
                    onClick={handleTableClick}
                  >
                    <div className="font-medium">Table {table.tableNumber}</div>
                    <div className="text-sm">
                      {table.occupied ? 'Occupied' : 'Available'}
                    </div>
                    {table.occupied && table.currentOrderId && (
                      <div className="text-xs mt-1 bg-white bg-opacity-50 rounded px-2 py-1">
                        Order: #{table.currentOrderId.slice(-6)}
                      </div>
                    )}
                    {table.occupied && (
                      <div className="text-xs mt-1 opacity-75">
                        Click to view order
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {tables.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tables configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
