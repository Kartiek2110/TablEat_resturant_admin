'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit2, Trash2, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import { 
  subscribeToTables,
  subscribeToOrders,
  updateTableStatus,
  type Table,
  type Order
} from '@/firebase/restaurant-service'
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { toast } from "sonner"
import OrderDetailsDialog from '@/components/OrderDetailsDialog'

// Helper function to get restaurant collection name
function getRestaurantCollectionName(restaurantName: string): string {
  return restaurantName.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase()
}

export default function TablesPage() {
  const { restaurantName } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: ''
  })

  useEffect(() => {
    if (!restaurantName) return

    const unsubscribeTables = subscribeToTables(restaurantName, (tableData) => {
      setTables(tableData)
      setLoading(false)
    })

    const unsubscribeOrders = subscribeToOrders(restaurantName, (orderData) => {
      setOrders(orderData)
    })

    return () => {
      unsubscribeTables()
      unsubscribeOrders()
    }
  }, [restaurantName])

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!restaurantName) return

    try {
      const tableNumber = parseInt(formData.tableNumber)
      const capacity = parseInt(formData.capacity)
      
      if (isNaN(tableNumber) || isNaN(capacity) || tableNumber < 1 || capacity < 1) {
        toast.error('Please enter valid table number and capacity')
        return
      }

      // Check if table number already exists
      const existingTable = tables.find(table => table.tableNumber === tableNumber)
      if (existingTable) {
        toast.error(`Table ${tableNumber} already exists`)
        return
      }

      const restaurantId = getRestaurantCollectionName(restaurantName)
      const tableId = `table_${tableNumber}`
      
      await setDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId), {
        tableNumber,
        capacity,
        occupied: false,
        updatedAt: new Date()
      })

      toast.success('Table added successfully!')
      setIsAddDialogOpen(false)
      setFormData({ tableNumber: '', capacity: '' })
    } catch (error) {
      console.error('Error adding table:', error)
      toast.error('Failed to add table')
    }
  }

  const handleDeleteTable = async (tableId: string, tableNumber: number) => {
    if (!restaurantName) return

    try {
      const restaurantId = getRestaurantCollectionName(restaurantName)
      await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId))
      toast.success(`Table ${tableNumber} deleted successfully!`)
    } catch (error) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table')
    }
  }

  const handleToggleOccupancy = async (table: Table) => {
    if (!restaurantName) return

    try {
      await updateTableStatus(restaurantName, table.tableNumber, !table.occupied)
      toast.success(`Table ${table.tableNumber} ${!table.occupied ? 'marked as occupied' : 'marked as available'}`)
    } catch (error) {
      console.error('Error updating table status:', error)
      toast.error('Failed to update table status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      </div>
    )
  }

  const occupiedTables = tables.filter(table => table.occupied)
  const availableTables = tables.filter(table => !table.occupied)

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Table Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your restaurant tables and track occupancy
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Add a new table to your restaurant
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Table Number *</Label>
                  <Input
                    id="tableNumber"
                    type="number"
                    min="1"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    placeholder="Enter table number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Number of Seats) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Enter seating capacity"
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Table</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Tables</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableTables.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedTables.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Tables</CardTitle>
          <CardDescription>
            Manage your table layout and occupancy status. Click occupied tables to view orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tables.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tables Added Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start by adding tables to your restaurant. You can manage their occupancy and track customer seating! 🪑
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <p>🏷️ <strong>Tip:</strong> Number your tables for easy identification</p>
                <p>👥 <strong>Capacity:</strong> Set the number of seats per table</p>
                <p>📊 <strong>Track:</strong> Monitor table occupancy in real-time</p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Table
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tables
                .sort((a, b) => a.tableNumber - b.tableNumber)
                .map((table) => (
                <Card 
                  key={table.id} 
                  className={`relative transition-all duration-200 hover:shadow-md ${
                    table.occupied 
                      ? 'border-red-200 bg-red-50 cursor-pointer hover:bg-red-100' 
                      : 'border-green-200 bg-green-50'
                  }`}
                  onClick={() => {
                    if (table.occupied && table.currentOrderId) {
                      // Find the order associated with this table
                      const associatedOrder = orders.find(order => order.id === table.currentOrderId)
                      if (associatedOrder) {
                        handleOrderClick(associatedOrder)
                      } else {
                        // Try to find by table number if currentOrderId doesn't match
                        const orderByTable = orders.find(order => 
                          order.tableNumber === table.tableNumber && 
                          (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready')
                        )
                        if (orderByTable) {
                          handleOrderClick(orderByTable)
                        } else {
                          toast.error('No active order found for this table')
                        }
                      }
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Table {table.tableNumber}</CardTitle>
                      <Badge 
                        variant={table.occupied ? "destructive" : "default"}
                        className={table.occupied ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                      >
                        {table.occupied ? (
                          <><XCircle className="h-3 w-3 mr-1" /> Occupied</>
                        ) : (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Available</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{table.capacity} seats</span>
                    </div>
                    
                    {table.occupied && table.currentOrderId && (
                      <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-800">Active Order</span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            #{table.currentOrderId.slice(-6)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600">
                          Click to view order details
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleOccupancy(table)
                        }}
                        className="flex-1"
                      >
                        {table.occupied ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Available
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Mark Occupied
                          </>
                        )}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Table</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete Table {table.tableNumber}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
