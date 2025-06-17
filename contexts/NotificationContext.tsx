'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { 
  subscribeToNotifications, 
  subscribeToOrders,
  markNotificationAsRead, 
  type Notification,
  type Order 
} from '@/firebase/restaurant-service'
import { toast } from 'sonner'
import { Bell, Clock, CheckCircle, AlertCircle, ShoppingCart, X, ExternalLink } from 'lucide-react'
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

// Enhanced New Order Popup Component
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

  useEffect(() => {
    const timer = setInterval(() => {
      if (order) {
        const elapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 1000)
        setTimeElapsed(elapsed)
      }
    }, 1000)

    // Auto close after 15 seconds
    const autoClose = setTimeout(() => {
      onClose()
    }, 15000)

    return () => {
      clearInterval(timer)
      clearTimeout(autoClose)
    }
  }, [order, onClose])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s ago`
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md animate-in slide-in-from-right duration-500">
      <Card className="border-2 border-red-500 shadow-2xl bg-white">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="font-bold text-red-600 text-lg flex items-center gap-2">
                  🔔 NEW ORDER ALERT!
                </h3>
                <p className="text-xs text-gray-500">
                  {order ? formatTime(timeElapsed) : 'Just now'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Table {notification.tableNumber}</span>
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  URGENT
                </Badge>
              </div>
              <p className="text-red-700 text-sm font-medium">{notification.message}</p>
              
              {order && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-red-600">
                    <strong>Customer:</strong> {order.customerName}
                  </p>
                  <p className="text-xs text-red-600">
                    <strong>Items:</strong> {order.items.length} items
                  </p>
                  <p className="text-xs text-red-600">
                    <strong>Total:</strong> ₹{order.totalAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={onViewOrders}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Orders Now
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="px-4"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced Audio Manager
class AudioManager {
  private audioContext: AudioContext | null = null
  private audioElement: HTMLAudioElement | null = null
  private isEnabled = true

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Initialize Web Audio Context
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
     
    }

    // Initialize HTML Audio Element
    try {
      this.audioElement = new Audio('/notification-sound.mp3')
      this.audioElement.volume = 0.9
      this.audioElement.preload = 'auto'
      
      // Test load
             this.audioElement.load()
    } catch (e) {
     
    }

    // Enable audio on first user interaction
    const enableAudio = () => {
      this.enableAudio()
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
    }
    
    document.addEventListener('click', enableAudio, { once: true })
    document.addEventListener('keydown', enableAudio, { once: true })
  }

  private async enableAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    this.isEnabled = true
  }

  private createBeepSequence() {
    if (!this.audioContext || !this.isEnabled) return

    try {
      const currentTime = this.audioContext.currentTime
      
      // Create urgent beep sequence (3 beeps)
      for (let i = 0; i < 3; i++) {
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        // Higher frequency for urgency
        oscillator.frequency.setValueAtTime(1000, currentTime + i * 0.3)
        oscillator.frequency.setValueAtTime(800, currentTime + i * 0.3 + 0.1)
        
        gainNode.gain.setValueAtTime(0, currentTime + i * 0.3)
        gainNode.gain.linearRampToValueAtTime(0.4, currentTime + i * 0.3 + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + i * 0.3 + 0.2)
        
        oscillator.start(currentTime + i * 0.3)
        oscillator.stop(currentTime + i * 0.3 + 0.2)
      }
    } catch (error) {
     
    }
  }

  async playNewOrderSound() {
    if (!this.isEnabled) return

    // Try HTML Audio first
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0
        await this.audioElement.play()
        return
      } catch (error) {
       
      }
    }

    // Fallback to Web Audio beeps
    this.createBeepSequence()
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { restaurantName } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [previousNotificationIds, setPreviousNotificationIds] = useState<Set<string>>(new Set())
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set())
  const [showPopup, setShowPopup] = useState<{ notification: Notification; order?: Order } | null>(null)
  const [lastOrderTime, setLastOrderTime] = useState<Date | null>(null)
  
  const audioManager = useRef<AudioManager>(new AudioManager())
  const isInitialLoad = useRef(true)
  const isInitialOrderLoad = useRef(true)

  // Initialize audio manager
  useEffect(() => {
    audioManager.current = new AudioManager()
    return () => {
      // Cleanup if needed
    }
  }, [])

  // Subscribe to notifications
  useEffect(() => {
    if (!restaurantName) return



    const unsubscribe = subscribeToNotifications(restaurantName, (newNotifications) => {
     
      
      if (isInitialLoad.current) {
        setNotifications(newNotifications)
        setPreviousNotificationIds(new Set(newNotifications.map(n => n.id)))
        isInitialLoad.current = false
        return
      }
      
      // Process new notifications
      const newNotificationsList = newNotifications.filter(n => !previousNotificationIds.has(n.id))
      
      if (newNotificationsList.length > 0) {
       
        
        newNotificationsList.forEach(notification => {
          if (notification.type === 'new_order') {
           
            
            // Find corresponding order
            const correspondingOrder = orders.find(o => o.id === notification.orderId)
            
            // Play sound immediately
            audioManager.current?.playNewOrderSound()

            // Show popup
            setShowPopup({ notification, order: correspondingOrder })

            // Show toast
            toast.error(
              `🚨 URGENT: NEW ORDER - Table ${notification.tableNumber}`,
              {
                description: notification.message,
                duration: 10000,
                action: {
                  label: 'View Orders',
                  onClick: () => window.location.href = '/dashboard/orders'
                }
              }
            )
          }
        })
      }
      
      setNotifications(newNotifications)
      setPreviousNotificationIds(new Set(newNotifications.map(n => n.id)))
    })

    return unsubscribe
  }, [restaurantName, orders])

  // Subscribe to orders for real-time monitoring
  useEffect(() => {
    if (!restaurantName) return



    const unsubscribe = subscribeToOrders(restaurantName, (newOrders) => {
     
      
      if (isInitialOrderLoad.current) {
        setOrders(newOrders)
        setPreviousOrderIds(new Set(newOrders.map(o => o.id)))
        isInitialOrderLoad.current = false
        return
      }
      
      // Check for new orders
      const newOrdersList = newOrders.filter(o => !previousOrderIds.has(o.id))
      
      if (newOrdersList.length > 0) {
       
        
        newOrdersList.forEach(order => {
          if (order.status === 'pending') {
           
            
            setLastOrderTime(new Date())
            
            // Play sound
            audioManager.current?.playNewOrderSound()

            // Create immediate notification if not exists
            const existingNotification = notifications.find(n => n.orderId === order.id)
            if (!existingNotification) {
              const urgentNotification: Notification = {
                id: `urgent-${order.id}`,
                type: 'new_order',
                title: '🚨 NEW ORDER ALERT!',
                message: `URGENT: Table ${order.tableNumber} - ${order.customerName} ordered ${order.items.length} items (₹${order.totalAmount})`,
                orderId: order.id,
                tableNumber: order.tableNumber,
                isRead: false,
                createdAt: new Date()
              }

              // Show popup immediately
              setShowPopup({ notification: urgentNotification, order })

              // Show urgent toast
              toast.error(
                `🚨 CRITICAL: NEW ORDER - Table ${order.tableNumber}`,
                {
                  description: `${order.customerName} just placed an order! ${order.items.length} items - ₹${order.totalAmount}`,
                  duration: 12000,
                  action: {
                    label: 'VIEW NOW',
                    onClick: () => window.location.href = '/dashboard/orders'
                  }
                }
              )
            }
          }
        })
      }
      
      setOrders(newOrders)
      setPreviousOrderIds(new Set(newOrders.map(o => o.id)))
    })

    return unsubscribe
  }, [restaurantName, notifications])

  const markAsRead = async (notificationId: string) => {
    if (!restaurantName) return
    
    try {
      await markNotificationAsRead(restaurantName, notificationId)
    } catch (error) {
     
    }
  }

  const clearAll = async () => {
    // Mark all as read
    const unreadNotifications = notifications.filter(n => !n.isRead)
    await Promise.all(
      unreadNotifications.map(n => markAsRead(n.id))
    )
  }

  const showNewOrderPopup = (notification: Notification) => {
    const order = orders.find(o => o.id === notification.orderId)
    setShowPopup({ notification, order })
  }

  const handleViewOrders = () => {
    setShowPopup(null)
    window.location.href = '/dashboard/orders'
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const pendingOrders = orders.filter(o => o.status === 'pending')

  const contextValue: NotificationContextType = {
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
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Global New Order Popup */}
      {showPopup && (
        <NewOrderPopup
          notification={showPopup.notification}
          order={showPopup.order}
          onClose={() => setShowPopup(null)}
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