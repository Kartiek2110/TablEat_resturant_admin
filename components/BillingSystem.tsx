'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getRestaurantByAdminEmail, type Restaurant } from '@/firebase/restaurant-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Printer, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  CreditCard,
  DollarSign
} from 'lucide-react'

// Types
interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

interface BillData {
  id: string
  tableNumber: number
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card' | 'upi' | 'other'
  customerName?: string
  customerPhone?: string
  notes?: string
  createdAt: Date
}

interface BillingSystemProps {
  tableNumber?: number
  preSelectedItems?: OrderItem[]
  onBillGenerated?: (bill: BillData) => void
}

export default function BillingSystem({ 
  tableNumber = 1, 
  preSelectedItems = [],
  onBillGenerated 
}: BillingSystemProps) {
  const { restaurantName, user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>(preSelectedItems)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'other'>('cash')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [notes, setNotes] = useState('')
  const [showInvoice, setShowInvoice] = useState(false)
  const [currentBill, setCurrentBill] = useState<BillData | null>(null)
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Fetch restaurant data for tax settings
  useEffect(() => {
    if (user?.email) {
      getRestaurantByAdminEmail(user.email)
        .then(restaurantData => {
          setRestaurant(restaurantData)
        })
        .catch(error => {
          console.error('Error fetching restaurant:', error)
        })
    }
  }, [user?.email])

  // Common menu items for quick add
  const quickItems = [
    { id: '1', name: 'Margherita Pizza', price: 12.99, category: 'Pizza' },
    { id: '2', name: 'Caesar Salad', price: 8.99, category: 'Salad' },
    { id: '3', name: 'Grilled Chicken', price: 15.99, category: 'Main Course' },
    { id: '4', name: 'Soft Drink', price: 2.99, category: 'Beverages' },
    { id: '5', name: 'French Fries', price: 4.99, category: 'Sides' },
    { id: '6', name: 'Chocolate Cake', price: 6.99, category: 'Dessert' },
  ]

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = (subtotal * discountPercentage) / 100
  const taxableAmount = subtotal - discountAmount
  const tax = restaurant?.taxEnabled && restaurant?.taxRate 
    ? (taxableAmount * restaurant.taxRate) / 100 
    : 0
  const total = taxableAmount + tax

  // Add item to order
  const addItem = (item: Omit<OrderItem, 'quantity'>) => {
    const existingItem = orderItems.find(oi => oi.id === item.id)
    if (existingItem) {
      setOrderItems(orderItems.map(oi => 
        oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi
      ))
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }])
    }
  }

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.id !== id))
    } else {
      setOrderItems(orderItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  // Remove item
  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id))
  }

  // Generate bill
  const generateBill = () => {
    const bill: BillData = {
      id: `BILL-${Date.now()}`,
      tableNumber,
      items: orderItems,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: notes || undefined,
      createdAt: new Date(),
    }

    setCurrentBill(bill)
    setShowInvoice(true)
    onBillGenerated?.(bill)
  }

  // Print invoice
  const printInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && invoiceRef.current) {
      const invoiceHTML = invoiceRef.current.innerHTML
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${currentBill?.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .invoice { max-width: 400px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .restaurant-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
              .address { font-size: 12px; color: #666; }
              .bill-details { margin: 20px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .items-table th, .items-table td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
              .items-table th { background-color: #f5f5f5; }
              .totals { margin-top: 20px; }
              .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
              .footer-brand { font-size: 12px; color: #666; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${invoiceHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (showInvoice && currentBill) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowInvoice(false)}
          >
            ← Back to Billing
          </Button>
          <Button 
            onClick={printInvoice}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        {/* Invoice */}
        <div ref={invoiceRef} className="bg-white p-8 shadow-lg rounded-lg invoice">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 restaurant-name">
              {restaurantName?.replace(/_/g, ' ') || 'Restaurant'}
            </h1>
            <div className="text-sm text-gray-600 address">
              <p>123 Main Street, Downtown</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Email: info@restaurant.com</p>
              <p>GSTIN: 07AAACR1234F1Z5</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-6 mb-6 bill-details">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bill Details</h3>
              <p className="text-sm text-gray-600">Invoice: {currentBill.id}</p>
              <p className="text-sm text-gray-600">Table: {currentBill.tableNumber}</p>
              <p className="text-sm text-gray-600">
                Date: {currentBill.createdAt.toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Time: {currentBill.createdAt.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
              <p className="text-sm text-gray-600">
                {currentBill.customerName || 'Walk-in Customer'}
              </p>
              {currentBill.customerPhone && (
                <p className="text-sm text-gray-600">{currentBill.customerPhone}</p>
              )}
              <p className="text-sm text-gray-600">
                Payment: {currentBill.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full items-table">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {currentBill.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">${item.price.toFixed(2)}</td>
                    <td className="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals">
            <div className="flex justify-between text-sm mb-2 total-row">
              <span>Subtotal:</span>
              <span>${currentBill.subtotal.toFixed(2)}</span>
            </div>
            {currentBill.discount > 0 && (
              <div className="flex justify-between text-sm mb-2 total-row text-green-600">
                <span>Discount:</span>
                <span>-${currentBill.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-2 total-row">
              <span>Tax (GST 18%):</span>
              <span>${currentBill.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t total-row final">
              <span>Total:</span>
              <span>${currentBill.total.toFixed(2)}</span>
            </div>
          </div>

          {currentBill.notes && (
            <div className="mt-6 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Notes:</strong> {currentBill.notes}
              </p>
            </div>
          )}

          <div className="text-center mt-8 pt-6 border-t footer">
            <p className="text-sm text-gray-600 mb-2">Thank you for dining with us!</p>
            <p className="text-xs text-gray-500 footer-brand">
              Powered by <strong>TablEat</strong> - Restaurant Management System
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Add Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Add Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start"
                    onClick={() => addItem(item)}
                  >
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                    <span className="text-sm font-semibold text-green-600">
                      ${item.price.toFixed(2)}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items added yet. Add items from the quick menu above.
                </p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <p className="text-sm font-semibold text-green-600">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Table Number:</span>
                  <Badge variant="outline">Table {tableNumber}</Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  />
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Tax (GST 18%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone (Optional)</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'cash', label: 'Cash', icon: DollarSign },
                      { value: 'card', label: 'Card', icon: CreditCard },
                      { value: 'upi', label: 'UPI', icon: CreditCard },
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={paymentMethod === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod(value as any)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special notes"
                  />
                </div>
              </div>

              <Button
                onClick={generateBill}
                className="w-full"
                disabled={orderItems.length === 0}
              >
                Generate Bill & Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 