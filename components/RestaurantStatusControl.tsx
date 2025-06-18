'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getRestaurantByAdminEmail, updateRestaurantStatus } from '@/firebase/restaurant-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Store, Power, PowerOff, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface Restaurant {
  id: string
  name: string
  status: 'active' | 'inactive'
  restaurant_open: boolean
  adminEmail: string
}

export default function RestaurantStatusControl() {
  const { user, restaurantName } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user?.email) {
        try {
          const restaurantData = await getRestaurantByAdminEmail(user.email)
          if (restaurantData) {
            setRestaurant({
              id: restaurantData.id,
              name: restaurantData.name,
              status: restaurantData.status,
              restaurant_open: restaurantData.restaurant_open ?? true,
              adminEmail: restaurantData.adminEmail
            })
          }
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        }
      }
    }
    fetchRestaurant()
  }, [user?.email])

  const updateRestaurantOpenStatus = async (isOpen: boolean) => {
    if (!restaurant || !restaurantName) return

    setLoading(true)
    try {
      await updateRestaurantStatus(restaurantName, {
        restaurant_open: isOpen
      })

      setRestaurant(prev => prev ? { ...prev, restaurant_open: isOpen } : null)
      
      toast.success(
        `Restaurant ${isOpen ? 'opened' : 'closed'}`,
        {
          description: isOpen 
            ? 'Your restaurant is now accepting orders' 
            : 'Your restaurant is now closed for orders'
        }
      )
    } catch (error) {
      console.error('Error updating restaurant status:', error)
      toast.error('Failed to update restaurant status')
    } finally {
      setLoading(false)
    }
  }

  if (!restaurant) {
    return null
  }

  const isOpen = restaurant.restaurant_open

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center space-x-2 ${
            isOpen 
              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' 
              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          }`}
          disabled={loading}
        >
          <Store className="h-4 w-4" />
          <span className="hidden sm:inline">{restaurant.name}</span>
          <Badge 
            variant={isOpen ? 'default' : 'destructive'}
            className={`ml-2 ${
              isOpen 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-1 ${
              isOpen ? 'bg-green-200' : 'bg-red-200'
            } ${isOpen ? 'animate-pulse' : ''}`}></div>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Store className="h-4 w-4" />
          <span>Restaurant Status</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOpen ? (
                <Power className="h-4 w-4 text-green-600" />
              ) : (
                <PowerOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {isOpen ? 'Restaurant Open' : 'Restaurant Closed'}
              </span>
            </div>
            <Switch
              checked={isOpen}
              onCheckedChange={updateRestaurantOpenStatus}
              disabled={loading}
            />
          </div>
          
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            {isOpen ? (
              <>
                <p className="font-medium text-green-700">✅ Accepting Orders</p>
                <p>Customers can place new orders</p>
              </>
            ) : (
              <>
                <p className="font-medium text-red-700">🚫 Not Accepting Orders</p>
                <p>New orders will be blocked</p>
              </>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-gray-500">
          <Settings className="h-3 w-3 mr-2" />
          Manage restaurant settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 