'use client'

import { useState, useEffect } from 'react'
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
  type Order,
  type Table,
  type MenuItem,
  type Restaurant
} from '@/firebase/restaurant-service'
import SubscriptionStatus from '@/components/SubscriptionStatus'

export default function Dashboard() {
  const { user, restaurantName } = useAuth()
  const { notifications } = useNotifications()
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

  useEffect(() => {
    if (!user?.email || !restaurantName) return

    let unsubscribeOrders: (() => void) | undefined
    let unsubscribeTables: (() => void) | undefined
    let unsubscribeMenu: (() => void) | undefined

    const initializeRestaurant = async () => {
      try {
        setLoading(true)
        
        // Check if restaurant exists
        let restaurantData = await getRestaurantByAdminEmail(user.email!)
        
        // If not, create it
        if (!restaurantData) {
          restaurantData = await createRestaurant(restaurantName, user.email!)
        }
        
        setRestaurant(restaurantData)

        // Set up real-time subscriptions
        unsubscribeOrders = subscribeToOrders(restaurantName, (orderData) => {
          
          // Auto-occupy tables for new pending orders
          orderData.forEach(async (order) => {
            if (order.status === 'pending') {
              try {
                await updateTableStatus(restaurantName, order.tableNumber, true, order.id)
              } catch (error) {
                console.error('Error auto-occupying table:', error)
              }
            }
          })
          
          setOrders(orderData)
        })

        unsubscribeTables = subscribeToTables(restaurantName, (tableData) => {
          setTables(tableData)
        })



        unsubscribeMenu = subscribeToMenuItems(restaurantName, (menuData) => {
          console.log('Menu updated:', menuData)
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

    return () => {
      unsubscribeOrders?.()
      unsubscribeTables?.()
      unsubscribeMenu?.()
    }
  }, [user?.email, restaurantName])

  // Calculate statistics
  const todayOrders = orders.filter(order => {
    const today = new Date().toDateString()
    return order.createdAt.toDateString() === today
  })

  const pendingOrders = orders.filter(order => order.status === 'pending')
  const occupiedTables = tables.filter(table => table.occupied)
  const unreadNotifications = notifications.filter(notification => !notification.isRead)

  const todayRevenue = todayOrders.reduce((total, order) => total + order.totalAmount, 0)


  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your restaurant today.
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live Data
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders.length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {todayOrders.length} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {occupiedTables.length}/{tables.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((occupiedTables.length / tables.length) * 100).toFixed(0)}% occupied
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
              Current table occupancy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {tables.map((table) => (
                <div 
                  key={table.id} 
                  className={`p-3 rounded-lg border text-center ${
                    table.occupied 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}
                >
                  <div className="font-medium">Table {table.tableNumber}</div>
                  <div className="text-sm">
                    {table.occupied ? 'Occupied' : 'Available'}
                  </div>
                </div>
              ))}
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

      {/* Active Notifications */}
      {unreadNotifications.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Active Notifications</span>
              <Badge variant="destructive">{unreadNotifications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadNotifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">{notification.title}</h4>
                    <p className="text-sm text-orange-700">{notification.message}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {notification.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600 text-sm">
                You'll see order updates and alerts here when customers place orders 🔔
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
