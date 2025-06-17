"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock Data
const mockAnalytics = [
  { item: "Margherita Pizza", sales: 120 },
  { item: "Spaghetti Carbonara", sales: 95 },
  { item: "Cheeseburger", sales: 80 },
  { item: "Tiramisu", sales: 60 },
  { item: "Caesar Salad", sales: 40 },
]

const mockNotifications = [
  { id: 1, message: "New order #ORD006 received!", time: "2 minutes ago", read: false },
  { id: 2, message: "Table 3 is now available.", time: "15 minutes ago", read: false },
  { id: 3, message: "Low stock on tomatoes.", time: "1 hour ago", read: true },
]

export function DashboardOverview() {
  const [restaurantActive, setRestaurantActive] = useState(true)

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Restaurant Status */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Restaurant Status</CardTitle>
          <CardDescription>Set your restaurant's operational status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="restaurant-status" className="text-base">
            {restaurantActive ? "Active (Open)" : "Inactive (Closed)"}
          </Label>
          <Switch
            id="restaurant-status"
            checked={restaurantActive}
            onCheckedChange={setRestaurantActive}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
          />
        </CardContent>
      </Card>

      {/* Quick Analytics */}
      <Card className="md:col-span-2 lg:col-span-1 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Top Selling Items (Overview)</CardTitle>
          <CardDescription>Quick glance at your best-sellers.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={mockAnalytics.slice(0, 3)}>
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

      {/* Recent Notifications */}
      <Card className="md:col-span-2 lg:col-span-1 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Notifications</CardTitle>
          <CardDescription>Latest alerts and updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockNotifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between rounded-md p-3 ${
                  notification.read ? "bg-muted/40 text-muted-foreground" : "bg-secondary/50 font-medium"
                }`}
              >
                <p className="text-sm">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for other overview stats */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Total Orders Today</CardTitle>
          <CardDescription>Number of orders received today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">42</div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Revenue Today</CardTitle>
          <CardDescription>Total revenue generated today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">$1,234.50</div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Available Tables</CardTitle>
          <CardDescription>Currently available tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">3</div>
        </CardContent>
      </Card>
    </div>
  )
}
