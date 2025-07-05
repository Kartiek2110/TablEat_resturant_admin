'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { createOrder, createNotification, subscribeToNotifications } from '@/firebase/restaurant-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function DebugNotificationsPage() {
  const { restaurantName } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [directNotifications, setDirectNotifications] = useState<any[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  // Direct subscription to test
  useEffect(() => {
    if (!restaurantName) return

    addLog(`Setting up direct subscription for: ${restaurantName}`)
    
    const unsubscribe = subscribeToNotifications(restaurantName, (notifications) => {
      addLog(`Direct subscription received ${notifications.length} notifications`)
      setDirectNotifications(notifications)
    })

    return unsubscribe
  }, [restaurantName])

  const testCreateOrder = async () => {
    if (!restaurantName) {
      toast.error('No restaurant name found')
      return
    }

    setLoading(true)
    addLog('Creating test order...')
    
    try {
      const testOrder = {
        customerName: 'Debug Customer',
        customerPhone: '9999999999',
        tableNumber: 99,
        items: [
          {
            menuItemId: 'debug-item',
            name: 'Debug Burger',
            price: 299,
            quantity: 1,
            notes: ''
          }
        ],
        status: 'pending' as const,
        totalAmount: 299,
        notes: 'Debug test order',
        orderSource: 'quick_order' as const,
        orderType: 'dine-in' as const
      }

      await createOrder(restaurantName, testOrder)
      addLog('Test order created successfully!')
      toast.success('Test order created! Check for notification.')
    } catch (error) {
      addLog(`Error creating test order: ${error}`)
      console.error('Error creating test order:', error)
      toast.error('Failed to create test order')
    } finally {
      setLoading(false)
    }
  }

  const testCreateNotification = async () => {
    if (!restaurantName) {
      toast.error('No restaurant name found')
      return
    }

    setLoading(true)
    addLog('Creating direct notification...')
    
    try {
      await createNotification(restaurantName, {
        type: 'new_order',
        title: 'Debug Notification',
        message: 'This is a direct notification test',
        tableNumber: 88,
        isRead: false
      })
      addLog('Direct notification created successfully!')
      toast.success('Direct notification created!')
    } catch (error) {
      addLog(`Error creating notification: ${error}`)
      console.error('Error creating notification:', error)
      toast.error('Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  const testAudio = () => {
    addLog('Testing audio...')
    const audio = new Audio('/notification-sound.mp3')
    audio.volume = 0.8
    audio.play().then(() => {
      addLog('Audio played successfully!')
    }).catch(error => {
      addLog(`Audio failed: ${error}`)
      // Try Web Audio API fallback
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        
        addLog('Web Audio API beep played!')
      } catch (webAudioError) {
        addLog(`Web Audio API also failed: ${webAudioError}`)
      }
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Notification System Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={testCreateOrder} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Test Order'}
            </Button>
            
            <Button 
              onClick={testCreateNotification} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Direct Notification'}
            </Button>

            <Button 
              onClick={testAudio} 
              variant="secondary"
              className="w-full"
            >
              Test Audio
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="font-semibold mb-2">Context Notifications ({unreadCount} unread)</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notifications from context</p>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{notification.title}</span>
                        <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Direct Subscription ({directNotifications.length})</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {directNotifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No notifications from direct subscription</p>
                ) : (
                  directNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{notification.title}</span>
                        <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Debug Logs</h3>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
              {debugLogs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p><strong>Restaurant:</strong> {restaurantName || 'Not found'}</p>
            <p><strong>Context Notifications:</strong> {notifications.length}</p>
            <p><strong>Direct Notifications:</strong> {directNotifications.length}</p>
            <p><strong>Unread Count:</strong> {unreadCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 