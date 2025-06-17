'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { 
  subscribeToNotifications, 
  subscribeToOrders,
  markNotificationAsRead, 
  type Notification,
  type Order 
} from '@/firebase/restaurant-service'
import { toast } from 'sonner'
import { Bell, ShoppingCart, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  clearAll: () => void
  showNewOrderPopup: (notification: Notification) => void
  orders: Order[]
  pendingOrders: Order[]
  lastOrderTime: Date | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Lightweight Audio Manager
class AudioManager {
  private audioElement: HTMLAudioElement | null = null
  private isEnabled = false
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized) return
    
    try {
      // Use simple HTML audio element only
      this.audioElement = new Audio('/notification-sound.mp3')
      this.audioElement.volume = 0.8
      this.audioElement.preload = 'auto'
      this.isInitialized = true
      
      // Enable on first interaction
      const enableAudio = () => {
        this.isEnabled = true
        document.removeEventListener('click', enableAudio)
        document.removeEventListener('keydown', enableAudio)
      }
      
      document.addEventListener('click', enableAudio, { once: true })
      document.addEventListener('keydown', enableAudio, { once: true })
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }

  async playNewOrderSound() {
    if (!this.isEnabled || !this.audioElement) return
    
    try {
      // Reset and play
      this.audioElement.currentTime = 0
      await this.audioElement.play()
    } catch (error) {
      console.warn('Audio play failed:', error)
    }
  }

  destroy() {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement = null
    }
    this.isEnabled = false
    this.isInitialized = false
  }
}

// Simplified New Order Popup Component
function NewOrderPopup({ 
  notification, 
  order, 
  onClose, 
  onViewOrders 
}: { 
  notification: Notification
  order?: Order
  onClose: () => void
  onViewOrders: () => void
}) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoCloseRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Timer for elapsed time
    if (order) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 1000)
        setTimeElapsed(elapsed)
      }, 1000)
    }

    // Auto close after 10 seconds
    autoCloseRef.current = setTimeout(onClose, 10000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    }
  }, [order, onClose])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm animate-in slide-in-from-right duration-300">
      <Card className="border-2 border-red-500 shadow-lg bg-white">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="font-bold text-red-600 text-sm">NEW ORDER!</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="bg-red-50 p-2 rounded border border-red-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-red-800 text-sm">Table {notification.tableNumber}</span>
                <span className="text-xs text-red-600">{order ? formatTime(timeElapsed) : 'Now'}</span>
              </div>
              <p className="text-red-700 text-xs mt-1">{notification.message}</p>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={onViewOrders}
                size="sm"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Orders
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { restaurantName } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set())
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set())
  const [showPopup, setShowPopup] = useState<{ notification: Notification; order?: Order } | null>(null)
  const [lastOrderTime, setLastOrderTime] = useState<Date | null>(null)
  
  const audioManager = useRef<AudioManager | null>(null)
  const isInitialLoad = useRef(true)
  const isInitialOrderLoad = useRef(true)

  // Initialize audio manager once
  useEffect(() => {
    audioManager.current = new AudioManager()
    
    return () => {
      if (audioManager.current) {
        audioManager.current.destroy()
        audioManager.current = null
      }
    }
  }, [])

  // Memoized handlers to prevent unnecessary re-renders
  const handleNotifications = useCallback((newNotifications: Notification[]) => {
    if (isInitialLoad.current) {
      setNotifications(newNotifications)
      setPreviousNotificationIds(new Set(newNotifications.map(n => n.id)))
      isInitialLoad.current = false
      return
    }
    
    // Only process truly new notifications
    const newNotificationsList = newNotifications.filter(n => !previousNotificationIds.has(n.id))
    
    if (newNotificationsList.length > 0) {
      newNotificationsList.forEach(notification => {
        if (notification.type === 'new_order') {
          // Play sound and show popup
          audioManager.current?.playNewOrderSound()
          
          const correspondingOrder = orders.find(o => o.id === notification.orderId)
          setShowPopup({ notification, order: correspondingOrder })

          // Show toast notification
          toast.error(`🚨 NEW ORDER - Table ${notification.tableNumber}`, {
            description: notification.message,
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/dashboard/orders'
            }
          })
        }
      })
    }
    
    setNotifications(newNotifications)
    setPreviousNotificationIds(new Set(newNotifications.map(n => n.id)))
  }, [orders])

  const handleOrders = useCallback((newOrders: Order[]) => {
    if (isInitialOrderLoad.current) {
      setOrders(newOrders)
      setPreviousOrderIds(new Set(newOrders.map(o => o.id)))
      isInitialOrderLoad.current = false
      return
    }
    
    // Check for new pending orders
    const newOrdersList = newOrders.filter(o => !previousOrderIds.has(o.id) && o.status === 'pending')
    
    if (newOrdersList.length > 0) {
      setLastOrderTime(new Date())
      
      newOrdersList.forEach(order => {
        audioManager.current?.playNewOrderSound()
        
        const urgentNotification: Notification = {
          id: `urgent-${order.id}`,
          type: 'new_order',
          title: 'NEW ORDER ALERT!',
          message: `Table ${order.tableNumber} - ${order.customerName} (${order.items.length} items)`,
          orderId: order.id,
          tableNumber: order.tableNumber,
          isRead: false,
          createdAt: new Date()
        }

        setShowPopup({ notification: urgentNotification, order })

        toast.error(`🚨 NEW ORDER - Table ${order.tableNumber}`, {
          description: `${order.customerName} - ${order.items.length} items`,
          duration: 8000,
          action: {
            label: 'View Now',
            onClick: () => window.location.href = '/dashboard/orders'
          }
        })
      })
    }
    
    setOrders(newOrders)
    setPreviousOrderIds(new Set(newOrders.map(o => o.id)))
  }, [])

  // Single subscription for notifications
  useEffect(() => {
    if (!restaurantName) return

    const unsubscribe = subscribeToNotifications(restaurantName, handleNotifications)
    return unsubscribe
  }, [restaurantName, handleNotifications])

  // Single subscription for orders
  useEffect(() => {
    if (!restaurantName) return

    const unsubscribe = subscribeToOrders(restaurantName, handleOrders)
    return unsubscribe
  }, [restaurantName, handleOrders])

  const markAsRead = async (notificationId: string) => {
    if (!restaurantName) return
    
    try {
      await markNotificationAsRead(restaurantName, notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const clearAll = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    await Promise.all(unreadNotifications.map(n => markAsRead(n.id)))
  }

  const showNewOrderPopup = (notification: Notification) => {
    const order = orders.find(o => o.id === notification.orderId)
    setShowPopup({ notification, order })
  }

  const handleViewOrders = useCallback(() => {
    setShowPopup(null)
    window.location.href = '/dashboard/orders'
  }, [])

  const handleClosePopup = useCallback(() => {
    setShowPopup(null)
  }, [])

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length
  const pendingOrders = orders.filter(o => o.status === 'pending')

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    showNewOrderPopup,
    orders,
    pendingOrders,
    lastOrderTime
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {showPopup && (
        <NewOrderPopup
          notification={showPopup.notification}
          order={showPopup.order}
          onClose={handleClosePopup}
          onViewOrders={handleViewOrders}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 