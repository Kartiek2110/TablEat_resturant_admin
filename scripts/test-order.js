// Test script to simulate the order structure you provided
// This will help test all the data extraction features

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

// This simulates what would happen when a customer places an order
// The processIncomingOrder function will:
// 1. Create the order in Firebase
// 2. Auto-occupy the table
// 3. Create/update customer data
// 4. Generate notification for the restaurant admin
// 5. Update analytics data

// To test this in your app, you can call:
// await processIncomingOrder("BY_THE_WAY", testOrder) 