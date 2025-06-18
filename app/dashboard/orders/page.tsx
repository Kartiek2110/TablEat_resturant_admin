'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ShoppingCart, DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle, User, XCircle, Download } from "lucide-react"
import { updateOrderStatus, type Order } from '@/firebase/restaurant-service'
import { useAuth } from '@/contexts/AuthContext'
import OrderDetailsDialog from '@/components/OrderDetailsDialog'
import { toast } from 'sonner'

export default function OrdersPage() {
  const { restaurantName } = useAuth()
  const { orders, pendingOrders } = useNotifications()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber.toString().includes(searchTerm)
  )

  // Calculate statistics
  const todayOrders = orders.filter(order => {
    const today = new Date().toDateString()
    return order.createdAt.toDateString() === today
  })

  const totalRevenue = orders
    .filter(order => order.status === 'served')
    .reduce((sum, order) => sum + order.totalAmount, 0)

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.filter(order => order.status === 'served').length : 0

  // Helper functions
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'preparing':
        return <User className="h-4 w-4" />
      case 'ready':
        return <CheckCircle className="h-4 w-4" />
      case 'served':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'ready':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'served':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getOrderTiming = (order: Order) => {
    const now = new Date()
    const minutesAgo = Math.floor((now.getTime() - order.createdAt.getTime()) / 60000)
    
    if (order.status === 'pending') {
      let text = ''
      if (minutesAgo >= 2880) { // More than 2 days
        const days = Math.floor(minutesAgo / 1440)
        text = `${days}d waiting`
      } else if (minutesAgo >= 120) { // More than 2 hours
        const hours = Math.floor(minutesAgo / 60)
        text = `${hours}h waiting`
      } else {
        text = `${minutesAgo}m waiting`
      }
      
      return {
        text,
        urgencyLevel: minutesAgo > 30 ? 'critical' : minutesAgo > 15 ? 'warning' : 'normal'
      }
    } else if (order.status === 'served') {
      const servedStatus = order.statusHistory?.find(s => s.status === 'served')
      if (servedStatus) {
        const totalMinutes = Math.floor((servedStatus.timestamp.getTime() - order.createdAt.getTime()) / 60000)
        let text = ''
        if (totalMinutes >= 2880) {
          const days = Math.floor(totalMinutes / 1440)
          text = `${days}d total`
        } else if (totalMinutes >= 120) {
          const hours = Math.floor(totalMinutes / 60)
          text = `${hours}h total`
        } else {
          text = `${totalMinutes}m total`
        }
        return {
          text,
          urgencyLevel: 'normal'
        }
      }
    }
    
    let text = ''
    if (minutesAgo >= 2880) {
      const days = Math.floor(minutesAgo / 1440)
      text = `${days}d ago`
    } else if (minutesAgo >= 120) {
      const hours = Math.floor(minutesAgo / 60)
      text = `${hours}h ago`
    } else {
      text = `${minutesAgo}m ago`
    }
    
    return {
      text,
      urgencyLevel: 'normal'
    }
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  const exportToExcel = () => {
    // Filter orders by date range if dates are selected
    let ordersToExport = filteredOrders
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59) // Include full end date
      
      ordersToExport = filteredOrders.filter(order => {
        const orderDate = order.createdAt
        return orderDate >= start && orderDate <= end
      })
    }

    // Import xlsx library dynamically
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel
      const excelData = ordersToExport.map(order => {
        const timing = getOrderTiming(order)
        return {
          'Order ID': order.id,
          'Customer Name': order.customerName,
          'Customer Phone': order.customerPhone || '',
          'Table Number': order.tableNumber,
          'Items': order.items.map(item => `${item.quantity}x ${item.name} (₹${item.price})`).join('; '),
          'Total Items': order.items.length,
          'Total Amount': order.totalAmount,
          'Order Status': order.status.toUpperCase(),
          'Order Source': order.orderSource || 'direct_order',
          'Timing': timing.text,
          'Notes': order.notes || '',
          'Created Date': order.createdAt.toLocaleDateString(),
          'Created Time': order.createdAt.toLocaleTimeString(),
          'Full DateTime': order.createdAt.toLocaleString(),
        }
      })

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Order ID
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 8 },  // Table Number
        { wch: 50 }, // Items
        { wch: 12 }, // Total Items
        { wch: 12 }, // Total Amount
        { wch: 12 }, // Order Status
        { wch: 15 }, // Order Source
        { wch: 15 }, // Timing
        { wch: 30 }, // Notes
        { wch: 12 }, // Created Date
        { wch: 12 }, // Created Time
        { wch: 20 }, // Full DateTime
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

      // Generate filename with current date
      const fileName = startDate && endDate 
        ? `orders_${startDate}_to_${endDate}.xlsx`
        : `orders_${new Date().toISOString().split('T')[0]}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, fileName)
      
      toast.success(`Orders exported successfully as ${fileName}`)
    }).catch((error) => {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export orders. Please try again.')
    })
  }

  if (!orders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage all your restaurant orders in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span>to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* URGENT ORDERS ALERT */}
      {pendingOrders.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              🚨 URGENT: {pendingOrders.length} PENDING ORDER{pendingOrders.length > 1 ? 'S' : ''}!
            </CardTitle>
            <CardDescription className="text-red-600">
              These orders need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {pendingOrders.slice(0, 3).map((order) => {
                const timing = getOrderTiming(order)
                return (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="animate-pulse">
                        Table {order.tableNumber}
                      </Badge>
                      <div>
                        <p className="font-semibold text-red-800">{order.customerName}</p>
                        <p className="text-sm text-red-600">{order.items.length} items • ₹{order.totalAmount}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`${
                          timing.urgencyLevel === 'critical' 
                            ? 'bg-red-100 text-red-800 border-red-300' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }`}
                      >
                        {timing.text}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {pendingOrders.length > 3 && (
                <p className="text-sm text-red-600 text-center pt-2">
                  +{pendingOrders.length - 3} more pending orders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders.length} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            Complete history of all orders placed at your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your order history will appear here once customers start placing orders. 
                Get ready to serve amazing food! 🍽️
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No orders match your search criteria. Try adjusting your search terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timing</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const timing = getOrderTiming(order)

                    return (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleOrderClick(order)}
                      >
                        <TableCell className="font-medium">
                          #{order.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            {order.customerPhone && (
                              <p className="text-xs text-gray-500">{order.customerPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Table {order.tableNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{order.items.length - 2} more items
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{order.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm font-medium ${
                            timing.urgencyLevel === 'critical' ? 'text-red-600' :
                            timing.urgencyLevel === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {timing.text}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={isOrderDialogOpen}
        onClose={() => {
          setIsOrderDialogOpen(false)
          setSelectedOrder(null)
        }}
      />
    </div>
  )
}
