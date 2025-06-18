'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Phone, 
  Calendar,
  ShoppingCart,
  Search,
  Star,
  TrendingUp,
  Download
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { 
  subscribeToCustomers,
  type Customer 
} from '@/firebase/restaurant-service'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export default function CustomersPage() {
  const { restaurantName } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribe = subscribeToCustomers(restaurantName, (customerData) => {
      setCustomers(customerData)
      setLoading(false)
    })

    return () => unsubscribe?.()
  }, [restaurantName])

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  // Calculate statistics
  const totalCustomers = customers.length
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0)
  const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0
  const loyalCustomers = customers.filter(customer => customer.totalOrders >= 3).length

  const exportToExcel = async () => {
    if (customers.length === 0) {
      toast.error("No customer data to export")
      return
    }

    setExporting(true)
    try {
      // Prepare data for Excel
      const excelData = customers.map((customer, index) => ({
        'S.No': index + 1,
        'Customer Name': customer.name,
        'Phone Number': customer.phone,
        'Email': customer.email || 'N/A',
        'Total Orders': customer.totalOrders,
        'Last Visit': customer.lastVisit.toLocaleDateString(),
        'Last Visit Time': customer.lastVisit.toLocaleTimeString(),
        'Registration Date': customer.createdAt.toLocaleDateString(),
        'Favorite Items': customer.favoriteItems.join(', ') || 'None',
        'Customer Status': customer.totalOrders >= 5 ? 'VIP' : customer.totalOrders >= 3 ? 'Loyal' : 'Regular'
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Customer Name
        { wch: 15 },  // Phone Number
        { wch: 25 },  // Email
        { wch: 12 },  // Total Orders
        { wch: 12 },  // Last Visit
        { wch: 12 },  // Last Visit Time
        { wch: 15 },  // Registration Date
        { wch: 30 },  // Favorite Items
        { wch: 15 }   // Customer Status
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0]
      const filename = `customers_${restaurantName}_${currentDate}.xlsx`

      // Write and download file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Customer data exported successfully! (${customers.length} customers)`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Failed to export customer data")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and view your customer database
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {totalCustomers} Customers
          </Badge>
          <Button
            onClick={exportToExcel}
            disabled={exporting || customers.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Orders/Customer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageOrdersPerCustomer.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyal Customers</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              3+ orders each
            </p>
          </CardContent>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your customer database will appear here once you start receiving orders. 
                Get ready to build lasting relationships! 👥
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>📞 <strong>Track:</strong> Customer contact information and preferences</p>
                <p>🛒 <strong>Monitor:</strong> Order history and favorite items</p>
                <p>⭐ <strong>Reward:</strong> Identify loyal customers for special offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Database ({filteredCustomers.length} of {totalCustomers})</CardTitle>
              <CardDescription>Search and manage your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Favorite Items</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                Member since {customer.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="font-mono">{customer.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.email || (
                            <span className="text-gray-400 italic">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <ShoppingCart className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{customer.totalOrders}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm">{customer.lastVisit.toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{customer.lastVisit.toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate text-sm">
                            {customer.favoriteItems.length > 0 ? (
                              <span title={customer.favoriteItems.join(', ')}>
                                {customer.favoriteItems.slice(0, 2).join(', ')}
                                {customer.favoriteItems.length > 2 && ` +${customer.favoriteItems.length - 2} more`}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">None yet</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.totalOrders >= 5 ? (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              <Star className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          ) : customer.totalOrders >= 3 ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Loyal
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Regular
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
