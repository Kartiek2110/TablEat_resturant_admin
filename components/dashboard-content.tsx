"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

// Mock Data
const mockMenu = [
  { id: "m1", name: "Spaghetti Carbonara", price: 15.99, available: true },
  { id: "m2", name: "Margherita Pizza", price: 12.5, available: true },
  { id: "m3", name: "Caesar Salad", price: 9.0, available: false },
  { id: "m4", name: "Cheeseburger", price: 14.0, available: true },
  { id: "m5", name: "Tiramisu", price: 7.5, available: true },
]

const mockOrders = [
  { id: "#ORD001", customer: "Alice Smith", total: 45.75, status: "Completed", date: "2024-05-20" },
  { id: "#ORD002", customer: "Bob Johnson", total: 22.0, status: "Pending", date: "2024-05-20" },
  { id: "#ORD003", customer: "Charlie Brown", total: 60.2, status: "Completed", date: "2024-05-19" },
  { id: "#ORD004", customer: "Diana Prince", total: 18.5, status: "Cancelled", date: "2024-05-19" },
  { id: "#ORD005", customer: "Eve Adams", total: 33.99, status: "Completed", date: "2024-05-18" },
]

const mockTables = [
  { id: 1, status: "Occupied", capacity: 4 },
  { id: 2, status: "Available", capacity: 2 },
  { id: 3, status: "Occupied", capacity: 6 },
  { id: 4, status: "Available", capacity: 4 },
  { id: 5, status: "Cleaning", capacity: 2 },
  { id: 6, status: "Available", capacity: 8 },
]

const mockAnalytics = [
  { item: "Margherita Pizza", sales: 120 },
  { item: "Spaghetti Carbonara", sales: 95 },
  { item: "Cheeseburger", sales: 80 },
  { item: "Tiramisu", sales: 60 },
  { item: "Caesar Salad", sales: 40 },
]

const mockNotifications = [
  { id: 1, message: "New order #ORD006 received!", time: "2 minutes ago" },
  { id: 2, message: "Table 3 is now available.", time: "15 minutes ago" },
  { id: 3, message: "Low stock on tomatoes.", time: "1 hour ago" },
]

const mockCustomerOrders = [
  {
    customer: "Alice Smith",
    orderId: "#ORD001",
    date: "2024-05-20",
    total: 45.75,
    items: ["Spaghetti Carbonara", "Tiramisu"],
  },
  {
    customer: "Alice Smith",
    orderId: "#ORD007",
    date: "2024-05-10",
    total: 30.0,
    items: ["Margherita Pizza", "Coca-Cola"],
  },
  { customer: "Bob Johnson", orderId: "#ORD002", date: "2024-05-20", total: 22.0, items: ["Cheeseburger", "Fries"] },
]

export function DashboardContent() {
  const [restaurantActive, setRestaurantActive] = useState(true)
  const [menuItems, setMenuItems] = useState(mockMenu)
  const [tables, setTables] = useState(mockTables)

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
    )
  }

  const toggleTableStatus = (id: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              status:
                table.status === "Occupied" ? "Available" : table.status === "Available" ? "Cleaning" : "Occupied",
            }
          : table,
      ),
    )
  }

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Restaurant Status */}
      <Card id="status">
        <CardHeader>
          <CardTitle>Restaurant Status</CardTitle>
          <CardDescription>Set your restaurant's operational status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="restaurant-status">{restaurantActive ? "Active (Open)" : "Inactive (Closed)"}</Label>
          <Switch id="restaurant-status" checked={restaurantActive} onCheckedChange={setRestaurantActive} />
        </CardContent>
      </Card>

      {/* Occupied Tables */}
      <Card id="tables" className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Occupied Tables</CardTitle>
          <CardDescription>Real-time status of your tables.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="p-4 text-center">
              <CardTitle className="text-xl">Table {table.id}</CardTitle>
              <CardDescription className="mt-1">Capacity: {table.capacity}</CardDescription>
              <Badge
                className={`mt-2 ${
                  table.status === "Occupied"
                    ? "bg-red-500 hover:bg-red-600"
                    : table.status === "Available"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                }`}
                onClick={() => toggleTableStatus(table.id)}
              >
                {table.status}
              </Badge>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Menu Management */}
      <Card id="menu" className="md:col-span-2">
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>Edit availability of food items.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Switch checked={item.available} onCheckedChange={() => toggleMenuItemAvailability(item.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card id="analytics" className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Best-Selling Items</CardTitle>
          <CardDescription>Top items by sales volume.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={mockAnalytics}>
              <XAxis
                dataKey="item"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.split(" ")[0]}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card id="notifications" className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Recent alerts and updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockNotifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                <p className="text-sm">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card id="orders" className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Overview of all past orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell className="hidden md:table-cell">{order.date}</TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      className={
                        order.status === "Completed"
                          ? "bg-green-500 hover:bg-green-600"
                          : order.status === "Pending"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-500 hover:bg-red-600"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Order Details</DropdownMenuItem>
                        <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order History Per Customer */}
      <Card id="customer-orders" className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order History Per Customer</CardTitle>
          <CardDescription>View past orders for specific customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomerOrders.map((order, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell>{order.items.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
