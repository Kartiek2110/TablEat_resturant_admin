"use client"

import { Home, Utensils, ClipboardList, BarChart, Bell, Table, LogOut, Users, ChevronDown, UserCircle, Receipt, Package, UserCheck } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getRestaurantByAdminEmail, Restaurant } from "@/firebase/restaurant-service"
// import { firebaseSignOut } from "@/firebase/auth" // Commented out Firebase import

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Quick Order",
    href: "/dashboard/quick-order",
    icon: Receipt,
  },
  {
    title: "Menu Management",
    href: "/dashboard/menu",
    icon: Utensils,
  },
  {
    title: "Order History",
    href: "/dashboard/orders",
    icon: ClipboardList,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Table Status",
    href: "/dashboard/tables",
    icon: Table,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    title: "Staff Management",
    href: "/dashboard/staff",
    icon: UserCheck,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user?.email) {
        try {
          const restaurantData = await getRestaurantByAdminEmail(user.email)
          setRestaurant(restaurantData)
        } catch (error) {
          console.error('Error fetching restaurant:', error)
        }
      }
    }
    fetchRestaurant()
  }, [user?.email])

  const handleLogout = async () => {
    // const result = await firebaseSignOut() // Commented out Firebase logout call
    // if (result.success) { // Commented out Firebase-related logic
    router.push("/login") // Always navigate to login for UI preview
    // } else { // Commented out Firebase-related logic
    //   console.error("Logout failed:", result.error) // Commented out Firebase-related logic
    //   alert("Failed to log out. Please try again.") // Commented out Firebase-related logic
    // }
  }

  // Filter navigation items based on approval status
  const memoizedNavItems = useMemo(() => {
    return navItems.filter(item => {
      // Always show these items
      if (!["Quick Order", "Analytics", "Customers", "Inventory", "Staff Management"].includes(item.title)) {
        return true
      }
      
      // Show Quick Order only if approved
      if (item.title === "Quick Order") {
        return restaurant?.quick_order_approved === true
      }
      
      // Show Analytics only if approved
      if (item.title === "Analytics") {
        return restaurant?.analytics_approved === true
      }
      
      // Show Customers only if approved
      if (item.title === "Customers") {
        return restaurant?.customer_approved === true
      }
      
      // Show Inventory only if approved
      if (item.title === "Inventory") {
        return restaurant?.inventory_management_approved === true
      }
      
      // Show Staff Management only if approved
      if (item.title === "Staff Management") {
        return restaurant?.staff_management_approved === true
      }
      
      return true
    })
  }, [restaurant])

  return (
    <Sidebar className="bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  Restaurant Admin
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] bg-popover text-popover-foreground">
                <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground">
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-accent hover:text-accent-foreground">
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memoizedNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link href={item.href} prefetch={false}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
