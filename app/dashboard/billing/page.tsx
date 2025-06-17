'use client'

import BillingSystem from '@/components/BillingSystem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, CreditCard, TrendingUp } from 'lucide-react'

export default function BillingPage() {
  const handleBillGenerated = (bill: any) => {
    // Here you could save the bill to Firebase or perform other actions
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Receipt className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Billing & Invoicing
          </h1>
          <p className="text-gray-600">
            Generate bills, process payments, and print professional invoices
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Bills Today</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Revenue Today</p>
                <p className="text-2xl font-bold text-blue-600">$0.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Avg. Bill</p>
                <p className="text-2xl font-bold text-purple-600">$0.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing System */}
      <BillingSystem 
        tableNumber={1} 
        onBillGenerated={handleBillGenerated}
      />
    </div>
  )
} 