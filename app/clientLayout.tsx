"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthProvider, AuthGuard, useAuth } from "@/contexts/AuthContext"
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext"
import { getRestaurantByAdminEmail, getSubscriptionStatus, type Restaurant } from '@/firebase/restaurant-service'
import { useState, useEffect, useMemo } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Crown, Calendar, AlertTriangle, Clock } from "lucide-react"
import NotificationDropdown from '@/components/NotificationDropdown'
import RestaurantStatusControl from '@/components/RestaurantStatusControl'
import { Toaster } from 'sonner'

// Navigation Header Component
function NavigationHeader() {
  const { user, logout, restaurantName } = useAuth()
  const { pendingOrders, unreadCount, lastOrderTime } = useNotifications()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user?.email) {
        const restaurantData = await getRestaurantByAdminEmail(user.email)
        setRestaurant(restaurantData)
      }
    }
    fetchRestaurant()
  }, [user?.email])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Memoize subscription status to prevent unnecessary re-renders
  const subscriptionStatus = useMemo(() => {
    return restaurant ? getSubscriptionStatus(restaurant) : null
  }, [restaurant])

  // Memoize pending orders alert to prevent unnecessary re-renders
  const pendingOrdersAlert = useMemo(() => {
    if (pendingOrders.length === 0) return null
    
    const latestTime = lastOrderTime 
      ? `${Math.floor((Date.now() - lastOrderTime.getTime()) / 60000)}m ago`
      : ''
    
    return {
      count: pendingOrders.length,
      latestTime
    }
  }, [pendingOrders.length, lastOrderTime])

  return (
    <header className="flex h-16 lg:h-[60px] items-center justify-between gap-4 border-b bg-white shadow-sm px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="font-bold text-lg md:text-xl text-gray-900">
              {restaurantName ? restaurantName.replace(/_/g, ' ') : 'Restaurant'} Admin
            </h1>
            <p className="text-xs text-gray-500 hidden md:block">Management Dashboard</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* URGENT: Pending Orders Alert */}
        {pendingOrdersAlert && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded-lg animate-pulse">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="text-sm">
              <div className="font-bold text-red-800">
                {pendingOrdersAlert.count} URGENT ORDER{pendingOrdersAlert.count > 1 ? 'S' : ''}!
              </div>
              <div className="text-red-600 text-xs">
                {pendingOrdersAlert.latestTime && `Latest: ${pendingOrdersAlert.latestTime}`}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white ml-2"
              onClick={() => window.location.href = '/dashboard/orders'}
            >
              VIEW NOW
            </Button>
          </div>
        )}

        {/* Subscription Status */}
        {subscriptionStatus && (
          <Badge 
            variant={subscriptionStatus.isValid ? "secondary" : "destructive"}
            className={`${
              subscriptionStatus.isValid 
                ? subscriptionStatus.daysRemaining > 7
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            {subscriptionStatus.daysRemaining} days left
          </Badge>
        )}

        {/* Restaurant Status Control */}
        <RestaurantStatusControl />

        {/* Notifications */}
        <NotificationDropdown />

        {/* TablEat Brand */}
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TablEat
          </span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">{user?.email?.split('@')[0]}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

// Main Layout Content
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== "/login"

  if (!showSidebar) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <NavigationHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Protected Layout Component
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't protect login page
  if (pathname === "/login") {
    return <LayoutContent>{children}</LayoutContent>
  }

  // Protect all other pages
  return (
    <AuthGuard>
      <LayoutContent>{children}</LayoutContent>
    </AuthGuard>
  )
}

// Main Client Layout Component
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProtectedLayout>{children}</ProtectedLayout>
        <Toaster position="top-right" richColors />
      </NotificationProvider>
    </AuthProvider>
  )
}
