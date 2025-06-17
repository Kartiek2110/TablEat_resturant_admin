"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface CustomerOrder {
  customer: string
  orderId: string
  date: string
  total: number
  items: string[]
}

const mockCustomerOrders: CustomerOrder[] = [
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
  { customer: "Charlie Brown", orderId: "#ORD003", date: "2024-05-19", total: 60.2, items: ["Steak", "Wine"] },
  { customer: "Diana Prince", orderId: "#ORD004", date: "2024-05-19", total: 18.5, items: ["Salad", "Water"] },
  { customer: "Eve Adams", orderId: "#ORD005", date: "2024-05-18", total: 33.99, items: ["Pasta", "Soda"] },
]

export function CustomerOrderHistory() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCustomerOrders = mockCustomerOrders.filter(
    (order) =>
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Customer Order History</CardTitle>
        <CardDescription>View past orders for specific customers.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Input
            placeholder="Search by Customer Name or Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomerOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No matching orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomerOrders.map((order, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{order.customer}</TableCell>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                  <TableCell>{order.items.join(", ")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
