"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Bell, AlertCircle, Clock } from "lucide-react"
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  type Notification 
} from "@/firebase/restaurant-service"

export function NotificationList() {
  const { restaurantName } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribe = subscribeToNotifications(restaurantName, (notificationData) => {
      setNotifications(notificationData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [restaurantName])

  const handleMarkAsRead = async (notificationId: string) => {
    if (!restaurantName) return
    
    try {
      await markNotificationAsRead(restaurantName, notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <Bell className="h-4 w-4 text-blue-600" />
      case 'order_ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'table_status':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'border-l-blue-500 bg-blue-50'
      case 'order_ready':
        return 'border-l-green-500 bg-green-50'
      case 'table_status':
        return 'border-l-orange-500 bg-orange-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your restaurant activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-50 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-blue-700">
              {notifications.filter(n => !n.isRead).length} unread
            </span>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Notifications</span>
          </CardTitle>
          <CardDescription>Your latest alerts and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-600">
                  You'll see order updates and alerts here when they arrive
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between rounded-lg p-4 border-l-4 transition-all duration-200 ${
                    notification.isRead 
                      ? "bg-gray-50 border-l-gray-300" 
                      : `${getTypeColor(notification.type)} shadow-sm`
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{notification.createdAt.toLocaleString()}</span>
                        {notification.tableNumber && (
                          <span className="bg-gray-200 px-2 py-0.5 rounded">
                            Table {notification.tableNumber}
                          </span>
                        )}
                        {notification.orderId && (
                          <span className="bg-blue-200 px-2 py-0.5 rounded">
                            Order #{notification.orderId.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:bg-blue-100"
                        title="Mark as read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {notification.isRead && (
                      <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                        Read
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total: {notifications.length} notifications</span>
                <span>Unread: {notifications.filter(n => !n.isRead).length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
