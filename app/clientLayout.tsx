"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AuthProvider, AuthGuard, useAuth } from "@/contexts/AuthContext"
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext"
import { useState, useEffect, memo } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Crown, AlertTriangle } from "lucide-react"
import NotificationDropdown from '@/components/NotificationDropdown'
import RestaurantStatusControl from '@/components/RestaurantStatusControl'
import { Toaster } from 'sonner'

// Simplified Navigation Header Component
const NavigationHeader = memo(() => {
  const { user, logout, restaurantName } = useAuth()
  const { pendingOrders } = useNotifications()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const pendingCount = pendingOrders.length

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-white shadow-sm px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="font-bold text-xl text-gray-900">
              {restaurantName ? restaurantName.replace(/_/g, ' ') : 'Restaurant'} Admin
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Pending Orders Alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-500 rounded-lg animate-pulse">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="text-sm">
              <div className="font-bold text-red-800">
                {pendingCount} ORDER{pendingCount > 1 ? 'S' : ''}!
              </div>
            </div>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2"
              onClick={() => window.location.href = '/dashboard/orders'}
            >
              VIEW NOW
            </Button>
          </div>
        )}

        {/* Restaurant Status Control */}
        <RestaurantStatusControl />

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
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
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
})

NavigationHeader.displayName = 'NavigationHeader'

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
          <main className="flex-1 p-6">{children}</main>
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
      </NotificationProvider>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}
