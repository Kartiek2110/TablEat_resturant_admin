#!/usr/bin/env node

// This script demonstrates how to test the order processing
// Run with: node scripts/run-test-order.js

console.log('🧪 Test Order Script')
console.log('===================')
console.log('')
console.log('To test the order processing functionality:')
console.log('')
console.log('1. 🚀 Start your Next.js app: npm run dev')
console.log('2. 🔐 Login to your restaurant admin dashboard')
console.log('3. 🧪 Click the "🧪 Test Order" button on the dashboard')
console.log('')
console.log('This will simulate the following order:')
console.log('')

const testOrder = {
  customerName: "kartik",
  customerPhone: "7011498995",
  tableNumber: 1,
  items: [
    {
      menuItemId: "cheeze_burger",
      name: "Cheeze Burger",
      notes: "",
      price: 79,
      quantity: 1
    },
    {
      menuItemId: "cheeze_pizza", 
      name: "Cheeze Pizza",
      notes: "",
      price: 119,
      quantity: 1
    }
  ],
  totalAmount: 213.84,
  notes: ""
}

console.log(JSON.stringify(testOrder, null, 2))
console.log('')
console.log('Expected Results:')
console.log('✅ Order created with status "pending"')
console.log('✅ Table 1 automatically occupied')
console.log('✅ Customer "kartik" saved to database')
console.log('✅ Notification appears in bell dropdown')
console.log('✅ Analytics updated with ₹213.84 revenue')
console.log('✅ Order appears in Recent Orders (clickable)')
console.log('✅ Order appears in Order History (clickable)')
console.log('✅ Customer appears in Customers page')
console.log('')
console.log('🎯 Click on any order to see the detailed popup with checkout/invoice features!')
console.log('') 