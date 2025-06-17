"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock Data
const mockAnalyticsSales = [
  { item: "Margherita Pizza", sales: 120 },
  { item: "Spaghetti Carbonara", sales: 95 },
  { item: "Cheeseburger", sales: 80 },
  { item: "Tiramisu", sales: 60 },
  { item: "Caesar Salad", sales: 40 },
]

const mockDailyRevenue = [
  { date: "Mon", revenue: 1200 },
  { date: "Tue", revenue: 1500 },
  { date: "Wed", revenue: 1300 },
  { date: "Thu", revenue: 1800 },
  { date: "Fri", revenue: 2500 },
  { date: "Sat", revenue: 3000 },
  { date: "Sun", revenue: 2000 },
]

const chartConfigSales = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
}

const chartConfigRevenue = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
}

export function AnalyticsDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Best-Selling Items Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Best-Selling Items</CardTitle>
          <CardDescription>Top items by sales volume.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigSales} className="min-h-[250px] w-full">
            <BarChart accessibilityLayer data={mockAnalyticsSales}>
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

      {/* Daily Revenue Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Daily Revenue</CardTitle>
          <CardDescription>Revenue generated over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigRevenue} className="min-h-[250px] w-full">
            <LineChart
              accessibilityLayer
              data={mockDailyRevenue}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Placeholder for other analytics */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Average Order Value</CardTitle>
          <CardDescription>Average value of each order.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">$35.70</div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Customer Retention Rate</CardTitle>
          <CardDescription>Percentage of returning customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">65%</div>
        </CardContent>
      </Card>
    </div>
  )
}
