'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  ShoppingCart,
  Receipt,
  CreditCard,
  Printer,
  CheckCircle,
  DollarSign,
  Calendar
} from "lucide-react"
import { updateOrderStatus, updateTableStatus, type Order } from '@/firebase/restaurant-service'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface OrderDetailsDialogProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

export default function OrderDetailsDialog({ order, isOpen, onClose }: OrderDetailsDialogProps) {
  const { restaurantName } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash')

  if (!order) return null

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'served': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!restaurantName) return
    
    setIsProcessing(true)
    try {
      await updateOrderStatus(restaurantName, order.id, newStatus)
      
      // If order is served, free up the table
      if (newStatus === 'served') {
        await updateTableStatus(restaurantName, order.tableNumber, false)
      }
      
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckout = async () => {
    if (!restaurantName) return
    
    setIsProcessing(true)
    try {
      // Update order status to served
      await updateOrderStatus(restaurantName, order.id, 'served')
      
      // Free up the table
      await updateTableStatus(restaurantName, order.tableNumber, false)
      
      toast.success('Order completed successfully! 🎉')
      onClose()
    } catch (error) {
      console.error('Error completing checkout:', error)
      toast.error('Failed to complete checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrintInvoice = () => {
    // Create invoice content
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Order #${order.id.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .details { margin: 20px 0; }
            .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurantName?.replace(/_/g, ' ') || 'Restaurant'}</h1>
            <p>Invoice #${order.id.slice(-6)}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Table:</strong> ${order.tableNumber}</p>
            <p><strong>Order Time:</strong> ${order.createdAt.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
          </div>
          
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price}</td>
                  <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total Amount: ₹${order.totalAmount.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Powered by TablEat</p>
          </div>
        </body>
      </html>
    `
    
    // Open print window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.05 // 5% tax
  const total = subtotal + tax

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Order Details #{order.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Complete order information and checkout options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {order.createdAt.toLocaleString()}
            </div>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Table {order.tableNumber}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.notes && (
                        <p className="text-sm text-gray-500">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{item.price} × {item.quantity}</div>
                      <div className="text-sm text-gray-500">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Actions */}
          {order.status !== 'served' && order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Checkout & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'upi') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="card">💳 Card</SelectItem>
                      <SelectItem value="upi">📱 UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Processing...' : 'Complete Order'}
                  </Button>
                  <Button
                    onClick={handlePrintInvoice}
                    variant="outline"
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Update Actions */}
          {order.status !== 'served' && order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => handleStatusUpdate('preparing')}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => handleStatusUpdate('ready')}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      onClick={() => handleStatusUpdate('served')}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                    >
                      Mark Served
                    </Button>
                  )}
                  <Button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isProcessing}
                    variant="destructive"
                    size="sm"
                  >
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Order Info */}
          {order.status === 'served' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-green-800">Order Completed!</h3>
                  <p className="text-green-600">This order has been successfully served.</p>
                  <Button
                    onClick={handlePrintInvoice}
                    variant="outline"
                    className="mt-4"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 