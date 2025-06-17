#!/usr/bin/env node

// This script demonstrates how to test the order processing
// Run with: node scripts/run-test-order.js

  


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

 