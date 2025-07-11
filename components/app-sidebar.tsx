"use client";

import {
  Home,
  Utensils,
  ClipboardList,
  BarChart,
  Bell,
  Table,
  LogOut,
  Users,
  ChevronDown,
  UserCircle,
  Receipt,
  Package,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRestaurantByAdminEmail,
  Restaurant,
} from "@/firebase/restaurant-service";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurant, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Filter navigation items based on approval status
  const memoizedNavItems = useMemo(() => {
    // Debug: Log restaurant permissions
    console.log("🔍 Sidebar: Restaurant data:", restaurant);
    console.log("🔍 Sidebar: Permissions:", {
      quick_order_approved: restaurant?.quick_order_approved,
      analytics_approved: restaurant?.analytics_approved,
      customer_approved: restaurant?.customer_approved,
      inventory_management_approved: restaurant?.inventory_management_approved,
      staff_management_approved: restaurant?.staff_management_approved,
    });

    return navItems.filter((item) => {
      // Always show these items
      if (
        ![
          "Quick Order",
          "Analytics",
          "Customers",
          "Inventory",
          "Staff Management",
        ].includes(item.title)
      ) {
        return true;
      }

      // Show Quick Order only if approved
      if (item.title === "Quick Order") {
        const shouldShow = restaurant?.quick_order_approved === true;
        console.log(`🔍 Quick Order should show: ${shouldShow}`);
        return shouldShow;
      }

      // Show Analytics only if approved
      if (item.title === "Analytics") {
        const shouldShow = restaurant?.analytics_approved === true;
        console.log(`🔍 Analytics should show: ${shouldShow}`);
        return shouldShow;
      }

      // Show Customers only if approved
      if (item.title === "Customers") {
        const shouldShow = restaurant?.customer_approved === true;
        console.log(`🔍 Customers should show: ${shouldShow}`);
        return shouldShow;
      }

      // Show Inventory only if approved
      if (item.title === "Inventory") {
        const shouldShow = restaurant?.inventory_management_approved === true;
        console.log(`🔍 Inventory should show: ${shouldShow}`);
        return shouldShow;
      }

      // Show Staff Management only if approved
      if (item.title === "Staff Management") {
        const shouldShow = restaurant?.staff_management_approved === true;
        console.log(`🔍 Staff Management should show: ${shouldShow}`);
        return shouldShow;
      }

      return true;
    });
  }, [restaurant]);

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
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
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
  );
}
