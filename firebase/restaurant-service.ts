// firebase/restaurant-service.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// Restaurant Data Types
export interface Restaurant {
  id: string
  name: string
  adminEmail: string
  adminPhone?: string
  createdAt: Date
  updatedAt: Date
  address?: string
  phone?: string
  description?: string
  status: 'active' | 'inactive'
  subscriptionStart: Date
  subscriptionEnd: Date
  subscriptionStatus: 'active' | 'expired' | 'trial'
  staff_management_code?: string
  inventory_management_code?: string
  inventory_management_approved?: boolean
  staff_management_approved?: boolean
  // New permission fields
  quick_order_approved: boolean
  analytics_approved: boolean
  customer_approved: boolean
  restaurant_open: boolean
  banner_image?: string
  // Tax settings
  taxEnabled?: boolean
  taxRate?: number
}

export interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  image?: string
  available: boolean
  createdAt: Date
  updatedAt: Date
  isBestSeller?: boolean
  isCombo?: boolean
  comboItems?: ComboItem[]
  ingredients?: MenuItemIngredient[]
  discount?: {
    isActive: boolean
    type: 'percentage' | 'fixed' // percentage discount or fixed amount off
    value: number // percentage (0-100) or fixed amount
    validFrom?: Date
    validTo?: Date
  }
}

export interface ComboItem {
  menuItemId: string
  name: string
  quantity: number
}

export interface Table {
  id: string
  tableNumber: number
  capacity: number
  occupied: boolean
  currentOrderId?: string
  updatedAt: Date
}

export interface Order {
  id: string
  customerName: string
  customerPhone: string
  tableNumber: number
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  totalAmount: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  orderSource: 'qr_code' | 'quick_order' | 'walk_in' | 'direct_order'
  dailyOrderNumber?: number
  paymentMethod?: 'cash' | 'card' | 'upi' | 'other'
  statusHistory?: {
    status: Order['status']
    timestamp: Date
    duration?: number
  }[]
}

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  lastVisit: Date
  favoriteItems: string[]
  createdAt: Date
}

export interface Notification {
  id: string
  type: 'new_order' | 'order_ready' | 'table_status' | 'customer_feedback'
  title: string
  message: string
  orderId?: string
  tableNumber?: number
  isRead: boolean
  createdAt: Date
}

export interface Discount {
  id: string
  name: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  isActive: boolean
  validFrom?: Date
  validTo?: Date
  createdAt: Date
  updatedAt: Date
}

// Inventory Management Types
export interface InventoryItem {
  id: string
  name: string
  description?: string
  unit: string // e.g., 'pieces', 'kg', 'liters', 'grams'
  currentStock: number
  minStockAlert: number
  cost: number // cost per unit
  supplier?: string
  createdAt: Date
  updatedAt: Date
}

export interface MenuItemIngredient {
  inventoryItemId: string
  name: string
  quantity: number // how much of this ingredient is needed
  unit: string
}

export interface StockTransaction {
  id: string
  inventoryItemId: string
  type: 'purchase' | 'usage' | 'adjustment'
  quantity: number
  reason: string
  orderId?: string // if used for an order
  createdAt: Date
  createdBy: string
}

// Staff Management Types
export interface StaffMember {
  id: string
  name: string
  phone: string
  email?: string
  position: 'waiter' | 'chef' | 'cashier' | 'manager' | 'cleaner'
  joinDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  staffId: string
  staffName: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: 'present' | 'absent' | 'half_day' | 'late'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Helper function to get restaurant collection name
function getRestaurantCollectionName(restaurantName: string): string {
  return restaurantName.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase()
}

// Restaurant Management
export async function createRestaurant(name: string, adminEmail: string): Promise<Restaurant> {
  try {
    const restaurantId = getRestaurantCollectionName(name)
    const now = new Date()
    const subscriptionEnd = new Date(now)
    subscriptionEnd.setMonth(now.getMonth() + 1) // 1 month subscription
    
    const restaurantData: Omit<Restaurant, 'id'> = {
      name,
      adminEmail,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      subscriptionStart: now,
      subscriptionEnd,
      subscriptionStatus: 'active',
      staff_management_code: '1234', // Default staff code
      inventory_management_code: '5678', // Default inventory code
      inventory_management_approved: false, // Initially false
      staff_management_approved: false, // Initially false
      quick_order_approved: false, // Initially false
      analytics_approved: false, // Initially false
      customer_approved: true, // Initially true
      restaurant_open: true // Initially open
    }

    // Create restaurant document in restaurants collection
    await setDoc(doc(db, 'restaurants', restaurantId), {
      ...restaurantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create restaurant details subcollection
    await setDoc(doc(db, 'restaurants', restaurantId, 'rest_details', 'info'), {
      ...restaurantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Tables will be added by admin through the table management page

   
    return { id: restaurantId, ...restaurantData }
  } catch (error) {
    console.error('Error creating restaurant:', error)
    throw new Error('Failed to create restaurant')
  }
}

export async function getRestaurant(restaurantName: string): Promise<Restaurant | null> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const docSnap = await getDoc(doc(db, 'restaurants', restaurantId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: restaurantId,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        subscriptionStart: data.subscriptionStart?.toDate() || new Date(),
        subscriptionEnd: data.subscriptionEnd?.toDate() || new Date()
      } as Restaurant
    }
    return null
  } catch (error) {
    console.error('Error getting restaurant:', error)
    return null
  }
}

export async function getRestaurantByAdminEmail(email: string): Promise<Restaurant | null> {
  try {
    // Extract restaurant name from email
    const match = email.match(/^(.+?)_admin@/)
    if (!match) return null
    
    const restaurantName = match[1]
    return await getRestaurant(restaurantName)
  } catch (error) {
    console.error('Error getting restaurant by admin email:', error)
    return null
  }
}

// Menu Management
export async function addMenuItem(restaurantName: string, item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create document ID from item name (clean and safe for Firestore)
    let docId = item.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim()
    
    // Check if document already exists and add number suffix if needed
    const docRef = doc(db, 'restaurants', restaurantId, 'menu', docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      // If document exists, add a timestamp suffix to make it unique
      docId = `${docId}_${Date.now()}`
    }
    
    // Use setDoc with custom ID
    const finalDocRef = doc(db, 'restaurants', restaurantId, 'menu', docId)
    await setDoc(finalDocRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      id: docId,
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error adding menu item:', error)
    throw new Error('Failed to add menu item')
  }
}

export async function updateMenuItem(restaurantName: string, itemId: string, updates: Partial<MenuItem>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const itemRef = doc(db, 'restaurants', restaurantId, 'menu', itemId)
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating menu item:', error)
    throw new Error('Failed to update menu item')
  }
}

export async function deleteMenuItem(restaurantName: string, itemId: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'menu', itemId))
  } catch (error) {
    console.error('Error deleting menu item:', error)
    throw new Error('Failed to delete menu item')
  }
}

export function subscribeToMenuItems(restaurantName: string, callback: (items: MenuItem[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'menu'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as MenuItem[]
    callback(items)
  })
}

// Order Management
export async function createOrder(restaurantName: string, order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  try {
    console.log(`🔵 Creating order for Table ${order.tableNumber} in ${restaurantName}`)
    
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const orderRef = collection(db, 'restaurants', restaurantId, 'orders')
    const docRef = await addDoc(orderRef, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log(`✅ Order created with ID: ${docRef.id}`)

    // Register customer for tracking (but don't count as completed order yet)
    if (order.customerName && order.customerPhone) {
      try {
        await registerCustomerForOrder(restaurantName, {
          name: order.customerName,
          phone: order.customerPhone,
          lastVisit: new Date(),
          orderItems: order.items.map(item => item.name)
        })
        console.log(`✅ Customer registered: ${order.customerName}`)
      } catch (customerError) {
        console.warn('Failed to register customer:', customerError)
        // Continue with order creation even if customer registration fails
      }
    }

    // Create notification for new order
    await createNotification(restaurantName, {
      type: 'new_order',
      title: 'New Order Received',
      message: `Table ${order.tableNumber} has placed a new order`,
      orderId: docRef.id,
      tableNumber: order.tableNumber,
      isRead: false
    })

    console.log(`✅ Notification created for order ${docRef.id}`)

    // Update table status
    console.log(`🔄 Updating Table ${order.tableNumber} status to occupied...`)
    try {
      await updateTableStatus(restaurantName, order.tableNumber, true, docRef.id)
      console.log(`✅ Table ${order.tableNumber} marked as occupied with order ${docRef.id}`)
    } catch (tableError) {
      console.error(`❌ Failed to update table ${order.tableNumber} status:`, tableError)
      // Don't throw error here - order creation should succeed even if table update fails
      // The auto-sync logic in the dashboard will handle any inconsistencies
    }

    const createdOrder = {
      id: docRef.id,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log(`🎉 Order creation completed:`, createdOrder)
    return createdOrder
  } catch (error) {
    console.error('❌ Error creating order:', error)
    throw new Error('Failed to create order')
  }
}

export async function updateOrderStatus(restaurantName: string, orderId: string, status: Order['status']): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId)
    
    // Get current order data to calculate timing
    const orderDoc = await getDoc(orderRef)
    if (!orderDoc.exists()) {
      throw new Error('Order not found')
    }
    
    const orderData = orderDoc.data()
    const currentOrder = {
      ...orderData,
      createdAt: orderData.createdAt?.toDate() || new Date(),
      updatedAt: orderData.updatedAt?.toDate() || new Date(),
      statusHistory: orderData.statusHistory?.map((status: any) => ({
        ...status,
        timestamp: status.timestamp?.toDate() || new Date()
      })) || []
    } as Order
    const now = new Date()
    
    // Calculate duration from last status change
    const lastStatusChange = currentOrder.statusHistory?.slice(-1)[0]
    const duration = lastStatusChange 
      ? Math.round((now.getTime() - lastStatusChange.timestamp.getTime()) / 60000) // minutes
      : Math.round((now.getTime() - currentOrder.createdAt.getTime()) / 60000)
    
    // Create new status history entry
    const newStatusEntry = {
      status,
      timestamp: Timestamp.fromDate(now),
      duration
    }
    
    const updatedStatusHistory = [
      ...(currentOrder.statusHistory || []),
      newStatusEntry
    ]
    
    // If order is being marked as served, update inventory and complete customer registration
    if (status === 'served') {
      try {
        await processOrderInventoryUpdate(restaurantName, currentOrder.items, orderId)
      } catch (inventoryError) {
        console.warn('Failed to update inventory for order:', inventoryError)
        // Continue with order status update even if inventory update fails
      }

      // Complete customer registration for served orders
      if (currentOrder.customerName && currentOrder.customerPhone) {
        try {
          await completeCustomerOrder(restaurantName, {
            name: currentOrder.customerName,
            phone: currentOrder.customerPhone,
            orderItems: currentOrder.items.map(item => item.name)
          })
        } catch (customerError) {
          console.warn('Failed to complete customer order registration:', customerError)
          // Continue with order status update even if customer update fails
        }
      }
    }
    
    await updateDoc(orderRef, {
      status,
      statusHistory: updatedStatusHistory,
      updatedAt: serverTimestamp()
    })

    // Update table status when order is completed or cancelled
    if (status === 'served' || status === 'cancelled') {
      try {
        await updateTableStatus(restaurantName, currentOrder.tableNumber, false)
      } catch (tableError) {
        console.warn('Failed to update table status:', tableError)
        // Continue even if table update fails
      }
    }

    // Create notification for order status change
    if (status === 'ready') {
      await createNotification(restaurantName, {
        type: 'order_ready',
        title: 'Order Ready',
        message: `Order for Table ${currentOrder.tableNumber} is ready`,
        orderId,
        tableNumber: currentOrder.tableNumber,
        isRead: false
      })
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

export function subscribeToOrders(restaurantName: string, callback: (orders: Order[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'orders'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        statusHistory: data.statusHistory?.map((status: any) => ({
          ...status,
          timestamp: status.timestamp?.toDate() || new Date()
        })) || []
      }
    }) as Order[]
    callback(orders)
  })
}

// Table Management
export async function updateTableStatus(restaurantName: string, tableNumber: number, occupied: boolean, currentOrderId?: string): Promise<void> {
  try {
    console.log(`🔄 updateTableStatus: Table ${tableNumber}, occupied: ${occupied}, orderId: ${currentOrderId}`)
    
    const restaurantId = getRestaurantCollectionName(restaurantName)
    console.log(`🔵 Restaurant ID: ${restaurantId}`)
    
    const tablesRef = collection(db, 'restaurants', restaurantId, 'tables')
    const q = query(tablesRef, where('tableNumber', '==', tableNumber))
    const snapshot = await getDocs(q)
    
    console.log(`🔍 Found ${snapshot.docs.length} tables with number ${tableNumber}`)
    
    if (!snapshot.empty) {
      const tableDoc = snapshot.docs[0]
      console.log(`📋 Table doc ID: ${tableDoc.id}, current data:`, tableDoc.data())
      
      await updateDoc(tableDoc.ref, {
        occupied,
        currentOrderId: currentOrderId || null,
        updatedAt: serverTimestamp()
      })
      
      console.log(`✅ Table ${tableNumber} status updated successfully`)
    } else {
      console.warn(`⚠️ Table ${tableNumber} not found in ${restaurantName}`)
      
      // List all available tables for debugging
      const allTablesSnapshot = await getDocs(tablesRef)
      console.log(`📊 Available tables in ${restaurantName}:`)
      allTablesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        console.log(`  - Table ${data.tableNumber} (ID: ${doc.id})`)
      })
      
      throw new Error(`Table ${tableNumber} not found`)
    }
  } catch (error) {
    console.error(`❌ Error updating table ${tableNumber} status:`, error)
    throw new Error('Failed to update table status')
  }
}

export function subscribeToTables(restaurantName: string, callback: (tables: Table[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'tables'),
    orderBy('tableNumber', 'asc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const tables = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Table[]
    callback(tables)
  })
}

// Customer Management

// Register customer during order creation (without counting completed orders yet)
export async function registerCustomerForOrder(restaurantName: string, customerData: {
  name: string
  phone: string
  lastVisit: Date
  orderItems: string[]
}): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create document ID from customer phone
    const docId = normalizePhoneNumber(customerData.phone)
    
    const docRef = doc(db, 'restaurants', restaurantId, 'customers', docId)
    
    // Check if customer already exists
    const existingDoc = await getDoc(docRef)
    
    if (existingDoc.exists()) {
      // Update existing customer info but don't increment orders yet
      const existingData = existingDoc.data() as Customer
      
      await updateDoc(docRef, {
        name: customerData.name, // Update name in case it changed
        lastVisit: serverTimestamp()
      })
      
      return {
        ...existingData,
        id: docId,
        name: customerData.name,
        lastVisit: customerData.lastVisit
      }
    } else {
      // Create new customer with 0 completed orders initially
      await setDoc(docRef, {
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 0, // Will be incremented when order is completed
        lastVisit: serverTimestamp(),
        favoriteItems: [],
        createdAt: serverTimestamp()
      })

      return {
        id: docId,
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 0,
        lastVisit: customerData.lastVisit,
        favoriteItems: [],
        createdAt: new Date()
      }
    }
  } catch (error) {
    console.error('Error registering customer:', error)
    throw new Error('Failed to register customer')
  }
}

// Complete customer registration when order is served
export async function completeCustomerOrder(restaurantName: string, customerData: {
  name: string
  phone: string
  orderItems: string[]
}): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create document ID from customer phone
    const docId = normalizePhoneNumber(customerData.phone)
    
    const docRef = doc(db, 'restaurants', restaurantId, 'customers', docId)
    
    // Check if customer exists
    const existingDoc = await getDoc(docRef)
    
    if (existingDoc.exists()) {
      // Update existing customer with completed order
      const existingData = existingDoc.data() as Customer
      const updatedFavoriteItems = [...new Set([...existingData.favoriteItems, ...customerData.orderItems])]
      
      await updateDoc(docRef, {
        name: customerData.name, // Update name in case it changed
        totalOrders: existingData.totalOrders + 1, // Increment only when order is completed
        lastVisit: serverTimestamp(),
        favoriteItems: updatedFavoriteItems
      })
      
      return {
        ...existingData,
        id: docId,
        name: customerData.name,
        totalOrders: existingData.totalOrders + 1,
        lastVisit: new Date(),
        favoriteItems: updatedFavoriteItems
      }
    } else {
      // Create new customer with first completed order
      await setDoc(docRef, {
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 1,
        lastVisit: serverTimestamp(),
        favoriteItems: customerData.orderItems,
        createdAt: serverTimestamp()
      })

      return {
        id: docId,
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 1,
        lastVisit: new Date(),
        favoriteItems: customerData.orderItems,
        createdAt: new Date()
      }
    }
  } catch (error) {
    console.error('Error completing customer order:', error)
    throw new Error('Failed to complete customer order')
  }
}

export async function createOrUpdateCustomer(restaurantName: string, customerData: {
  name: string
  phone: string
  totalOrders: number
  lastVisit: Date
  favoriteItems: string[]
}): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create document ID from customer phone
    const docId = normalizePhoneNumber(customerData.phone)
    
    const docRef = doc(db, 'restaurants', restaurantId, 'customers', docId)
    
    // Check if customer already exists
    const existingDoc = await getDoc(docRef)
    
    if (existingDoc.exists()) {
      // Update existing customer
      const existingData = existingDoc.data() as Customer
      const updatedFavoriteItems = [...new Set([...existingData.favoriteItems, ...customerData.favoriteItems])]
      
      await updateDoc(docRef, {
        name: customerData.name, // Update name in case it changed
        totalOrders: existingData.totalOrders + 1,
        lastVisit: serverTimestamp(),
        favoriteItems: updatedFavoriteItems
      })
      
      return {
        ...existingData,
        id: docId,
        name: customerData.name,
        totalOrders: existingData.totalOrders + 1,
        lastVisit: customerData.lastVisit,
        favoriteItems: updatedFavoriteItems
      }
    } else {
      // Create new customer
      await setDoc(docRef, {
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 1,
        lastVisit: serverTimestamp(),
        favoriteItems: customerData.favoriteItems,
        createdAt: serverTimestamp()
      })

      return {
        id: docId,
        name: customerData.name,
        phone: customerData.phone,
        totalOrders: 1,
        lastVisit: customerData.lastVisit,
        favoriteItems: customerData.favoriteItems,
        createdAt: new Date()
      }
    }
  } catch (error) {
    console.error('Error creating/updating customer:', error)
    throw new Error('Failed to create/update customer')
  }
}

export async function saveCustomer(restaurantName: string, customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create document ID from customer phone or name
    const docId = customer.phone || customer.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim()
    
    const docRef = doc(db, 'restaurants', restaurantId, 'customers', docId)
    await setDoc(docRef, {
      ...customer,
      createdAt: serverTimestamp()
    })

    return {
      id: docId,
      ...customer,
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Error saving customer:', error)
    throw new Error('Failed to save customer')
  }
}

// Helper function to ensure customer phone numbers are properly handled
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/[^0-9]/g, '')
}

// Notification Management
export async function createNotification(restaurantName: string, notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const notificationRef = collection(db, 'restaurants', restaurantId, 'notifications')
    await addDoc(notificationRef, {
      ...notification,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

export async function markNotificationAsRead(restaurantName: string, notificationId: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const notificationRef = doc(db, 'restaurants', restaurantId, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      isRead: true
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

export function subscribeToNotifications(restaurantName: string, callback: (notifications: Notification[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'notifications'),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Notification[]
    callback(notifications)
  })
}

// Order Processing - This function processes orders that come from customer side
export async function processIncomingOrder(restaurantName: string, orderData: {
  customerName: string
  customerPhone: string
  tableNumber: number
  items: OrderItem[]
  totalAmount: number
  notes?: string
}): Promise<void> {
  try {
    console.log(`🔵 processIncomingOrder called for ${restaurantName}:`, orderData)
    
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Create the order with pending status
    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tableNumber: orderData.tableNumber,
      items: orderData.items,
      status: 'pending',
      totalAmount: orderData.totalAmount,
      notes: orderData.notes || '',
      orderSource: 'direct_order'
    }

    console.log(`🔄 processIncomingOrder: About to create order with data:`, order)

    // Create order in Firebase (this also updates table status automatically)
    const createdOrder = await createOrder(restaurantName, order)
    
    console.log(`✅ processIncomingOrder: Order created successfully:`, createdOrder)
    
    // Create notification for new order
    await createNotification(restaurantName, {
      type: 'new_order',
      title: 'New Order Received',
      message: `Order from ${orderData.customerName} - ${orderData.items.length} items, Table ${orderData.tableNumber}`,
      isRead: false,
      tableNumber: orderData.tableNumber,
      orderId: createdOrder.id
    })
    
    console.log(`✅ processIncomingOrder: Notification created for order ${createdOrder.id}`)
    
    // Note: Customer registration and table status update are handled by the createOrder function above
    // Customers will be properly registered when orders are completed (marked as 'served')

   
  } catch (error) {
    console.error('❌ Error processing incoming order:', error)
    throw new Error('Failed to process order')
  }
}

// Get order statistics for analytics
// Helper functions for discount calculations
export function calculateDiscountedPrice(menuItem: MenuItem): { originalPrice: number; discountedPrice: number; discountAmount: number; hasDiscount: boolean } {
  const originalPrice = menuItem.price
  
  if (!menuItem.discount || !menuItem.discount.isActive) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountAmount: 0,
      hasDiscount: false
    }
  }

  const discount = menuItem.discount
  const now = new Date()
  
  // Check if discount is valid (within date range if specified)
  if (discount.validFrom && now < discount.validFrom) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountAmount: 0,
      hasDiscount: false
    }
  }
  
  if (discount.validTo && now > discount.validTo) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountAmount: 0,
      hasDiscount: false
    }
  }

  let discountAmount = 0
  if (discount.type === 'percentage') {
    discountAmount = (originalPrice * discount.value) / 100
  } else {
    discountAmount = Math.min(discount.value, originalPrice) // Don't let fixed discount exceed price
  }

  const discountedPrice = Math.max(originalPrice - discountAmount, 0) // Don't go below 0

  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    hasDiscount: true
  }
}

export function getDiscountDisplayText(menuItem: MenuItem): string | null {
  if (!menuItem.discount || !menuItem.discount.isActive) {
    return null
  }

  const discount = menuItem.discount
  const now = new Date()
  
  // Check if discount is valid
  if (discount.validFrom && now < discount.validFrom) return null
  if (discount.validTo && now > discount.validTo) return null

  if (discount.type === 'percentage') {
    return `${discount.value}% OFF`
  } else {
    return `₹${discount.value} OFF`
  }
}

export function getOrderAnalytics(orders: Order[], menuItems: MenuItem[]) {
  const completedOrders = orders.filter(order => order.status === 'served')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  
  // Calculate popular items
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { name: item.name, quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      itemSales.set(item.menuItemId, existing)
    })
  })

  const popularItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)

  // Calculate daily revenue for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toDateString()
  }).reverse()

  const dailyRevenue = last7Days.map(dateStr => {
    const dayOrders = completedOrders.filter(order => 
      order.createdAt.toDateString() === dateStr
    )
    const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: revenue,
      orders: dayOrders.length
    }
  })

  // Category analysis
  const categoryData = new Map<string, { revenue: number; count: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      const category = menuItem?.category || 'Other'
      const existing = categoryData.get(category) || { revenue: 0, count: 0 }
      existing.revenue += item.price * item.quantity
      existing.count += item.quantity
      categoryData.set(category, existing)
    })
  })

  const categoryChartData = Array.from(categoryData.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Payment method analytics
  const paymentMethodData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const method = order.paymentMethod || 'cash' // default to cash if not specified
    const existing = paymentMethodData.get(method) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    paymentMethodData.set(method, existing)
  })

  const paymentMethodChartData = Array.from(paymentMethodData.entries())
    .map(([method, data]) => ({ method, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Order source analytics
  const orderSourceData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const source = order.orderSource || 'direct_order' // default to direct_order if not specified
    const existing = orderSourceData.get(source) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    orderSourceData.set(source, existing)
  })

  const orderSourceChartData = Array.from(orderSourceData.entries())
    .map(([source, data]) => ({ 
      source: source === 'quick_order' ? 'Quick Order' : 'Regular Order', 
      sourceKey: source,
      ...data 
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    popularItems,
    dailyRevenue,
    categoryChartData,
    paymentMethodChartData,
    orderSourceChartData,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    pendingOrders: orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length
  }
}

// Subscribe to customers
export function subscribeToCustomers(restaurantName: string, callback: (customers: Customer[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'customers'),
    orderBy('lastVisit', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastVisit: doc.data().lastVisit?.toDate() || new Date()
    })) as Customer[]
    callback(customers)
  })
}

// Subscription Management
export function getSubscriptionStatus(restaurant: Restaurant): {
  isValid: boolean
  daysRemaining: number
  status: 'active' | 'expired' | 'trial'
} {
  const now = new Date()
  const endDate = restaurant.subscriptionEnd
  const timeDiff = endDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  return {
    isValid: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    status: daysRemaining > 0 ? restaurant.subscriptionStatus : 'expired'
  }
}

export async function renewSubscription(restaurantName: string, months: number = 1): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const restaurant = await getRestaurant(restaurantName)
    
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }
    
    const now = new Date()
    const currentEnd = restaurant.subscriptionEnd
    const newEnd = new Date(Math.max(now.getTime(), currentEnd.getTime()))
    newEnd.setMonth(newEnd.getMonth() + months)
    
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      subscriptionEnd: newEnd,
      subscriptionStatus: 'active',
      updatedAt: serverTimestamp()
    })
    
    
  } catch (error) {
    console.error('Error renewing subscription:', error)
    throw new Error('Failed to renew subscription')
  }
}

// ============ INVENTORY MANAGEMENT FUNCTIONS ============

export async function addInventoryItem(restaurantName: string, item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'inventory'), {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    const newItem = {
      id: docRef.id,
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    }

   
    return newItem
  } catch (error) {
    console.error('Error adding inventory item:', error)
    throw new Error('Failed to add inventory item')
  }
}

export async function updateInventoryItem(restaurantName: string, itemId: string, updates: Partial<InventoryItem>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId, 'inventory', itemId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
   
  } catch (error) {
    console.error('Error updating inventory item:', error)
    throw new Error('Failed to update inventory item')
  }
}

export async function deleteInventoryItem(restaurantName: string, itemId: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'inventory', itemId))
   
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    throw new Error('Failed to delete inventory item')
  }
}

export function subscribeToInventoryItems(restaurantName: string, callback: (items: InventoryItem[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'inventory'),
    orderBy('name', 'asc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as InventoryItem[]
    callback(items)
  })
}

export async function updateMenuItemIngredients(restaurantName: string, menuItemId: string, ingredients: MenuItemIngredient[]): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const docPath = `restaurants/${restaurantId}/menu/${menuItemId}`
   
    
    // First check if the document exists
    const docRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      console.error('Menu item document does not exist:', docPath)
      throw new Error(`Menu item with ID ${menuItemId} does not exist`)
    }
    
    await updateDoc(docRef, {
      ingredients,
      updatedAt: serverTimestamp()
    })
   
  } catch (error) {
    console.error('Error updating menu item ingredients:', error)
    throw new Error('Failed to update menu item ingredients')
  }
}

export async function processOrderInventoryUpdate(restaurantName: string, orderItems: OrderItem[], orderId: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const batch = writeBatch(db)

    // Get all menu items to find ingredients
    const menuSnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'menu'))
    const menuItems = new Map<string, MenuItem>()
    
    menuSnapshot.docs.forEach(doc => {
      const item = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as MenuItem
      menuItems.set(item.id, item)
    })

    // Calculate total ingredient usage
    const ingredientUsage = new Map<string, number>()
    
    orderItems.forEach(orderItem => {
      const menuItem = menuItems.get(orderItem.menuItemId)
      if (menuItem?.ingredients) {
        menuItem.ingredients.forEach(ingredient => {
          const totalUsage = ingredient.quantity * orderItem.quantity
          const current = ingredientUsage.get(ingredient.inventoryItemId) || 0
          ingredientUsage.set(ingredient.inventoryItemId, current + totalUsage)
        })
      }
    })

    // Update inventory and create transactions
    for (const [inventoryItemId, usageAmount] of ingredientUsage) {
      const inventoryRef = doc(db, 'restaurants', restaurantId, 'inventory', inventoryItemId)
      const inventoryDoc = await getDoc(inventoryRef)
      
      if (inventoryDoc.exists()) {
        const currentStock = inventoryDoc.data().currentStock || 0
        const newStock = Math.max(0, currentStock - usageAmount)
        
        // Update inventory
        batch.update(inventoryRef, {
          currentStock: newStock,
          updatedAt: serverTimestamp()
        })

        // Create transaction record
        const transactionRef = doc(collection(db, 'restaurants', restaurantId, 'stock_transactions'))
        batch.set(transactionRef, {
          inventoryItemId,
          type: 'usage',
          quantity: -usageAmount,
          reason: `Order #${orderId}`,
          orderId,
          createdAt: serverTimestamp(),
          createdBy: 'system'
        })
      }
    }

    await batch.commit()
   
  } catch (error) {
    console.error('Error updating inventory for order:', error)
    throw new Error('Failed to update inventory for order')
  }
}

// ============ STAFF MANAGEMENT FUNCTIONS ============

export async function setStaffManagementCode(restaurantName: string, code: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      staff_management_code: code,
      updatedAt: serverTimestamp()
    })
   
  } catch (error) {
    console.error('Error updating staff management code:', error)
    throw new Error('Failed to update staff management code')
  }
}

export async function verifyStaffManagementCode(restaurantName: string, code: string): Promise<boolean> {
  try {
    const restaurant = await getRestaurant(restaurantName)
    return restaurant?.staff_management_code === code
  } catch (error) {
    console.error('Error verifying staff management code:', error)
    return false
  }
}

// ============ INVENTORY MANAGEMENT CODE FUNCTIONS ============

export async function setInventoryManagementCode(restaurantName: string, code: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      inventory_management_code: code,
      updatedAt: serverTimestamp()
    })
   
  } catch (error) {
    console.error('Error updating inventory management code:', error)
    throw new Error('Failed to update inventory management code')
  }
}

export async function verifyInventoryManagementCode(restaurantName: string, code: string): Promise<boolean> {
  try {
    const restaurant = await getRestaurant(restaurantName)
    return restaurant?.inventory_management_code === code
  } catch (error) {
    console.error('Error verifying inventory management code:', error)
    return false
  }
}

export async function addStaffMember(restaurantName: string, staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'staff'), {
      ...staff,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    const newStaff = {
      id: docRef.id,
      ...staff,
      createdAt: new Date(),
      updatedAt: new Date()
    }

   
    return newStaff
  } catch (error) {
    console.error('Error adding staff member:', error)
    throw new Error('Failed to add staff member')
  }
}

export async function updateStaffMember(restaurantName: string, staffId: string, updates: Partial<StaffMember>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId, 'staff', staffId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
   
  } catch (error) {
    console.error('Error updating staff member:', error)
    throw new Error('Failed to update staff member')
  }
}

export function subscribeToStaffMembers(restaurantName: string, callback: (staff: StaffMember[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'staff'),
    orderBy('name', 'asc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const staff = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinDate: doc.data().joinDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as StaffMember[]
    callback(staff)
  })
}

export async function markAttendance(restaurantName: string, attendance: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const dateStr = attendance.date.toDateString()
    
    // Check if attendance already exists for this staff on this date
    const q = query(
      collection(db, 'restaurants', restaurantId, 'attendance'),
      where('staffId', '==', attendance.staffId),
      where('date', '==', Timestamp.fromDate(attendance.date))
    )
    
    const existingSnapshot = await getDocs(q)
    
    if (!existingSnapshot.empty) {
      // Update existing attendance
      const existingDoc = existingSnapshot.docs[0]
      await updateDoc(existingDoc.ref, {
        ...attendance,
        updatedAt: serverTimestamp()
      })
    } else {
      // Create new attendance record
      await addDoc(collection(db, 'restaurants', restaurantId, 'attendance'), {
        ...attendance,
        date: Timestamp.fromDate(attendance.date),
        checkIn: attendance.checkIn ? Timestamp.fromDate(attendance.checkIn) : null,
        checkOut: attendance.checkOut ? Timestamp.fromDate(attendance.checkOut) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
    
   
  } catch (error) {
    console.error('Error marking attendance:', error)
    throw new Error('Failed to mark attendance')
  }
}

export function subscribeToAttendance(restaurantName: string, callback: (attendance: AttendanceRecord[]) => void) {
  const restaurantId = getRestaurantCollectionName(restaurantName)
  const q = query(
    collection(db, 'restaurants', restaurantId, 'attendance'),
    orderBy('date', 'desc')
  )
  
  return onSnapshot(q, (snapshot) => {
    const attendance = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
      checkIn: doc.data().checkIn?.toDate(),
      checkOut: doc.data().checkOut?.toDate(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as AttendanceRecord[]
    callback(attendance)
  })
}

// ============ ENHANCED ANALYTICS FUNCTIONS ============

export function getOrderAnalyticsWithDateFilter(
  orders: Order[], 
  menuItems: MenuItem[], 
  startDate?: Date, 
  endDate?: Date, 
  menuItemId?: string
) {
  // Filter orders by date range
  let filteredOrders = orders
  if (startDate || endDate) {
    filteredOrders = orders.filter(order => {
      const orderDate = order.createdAt
      if (startDate && orderDate < startDate) return false
      if (endDate && orderDate > endDate) return false
      return true
    })
  }

  // Filter by specific menu item if provided
  if (menuItemId) {
    filteredOrders = filteredOrders.filter(order => 
      order.items.some(item => item.menuItemId === menuItemId)
    )
  }

  const completedOrders = filteredOrders.filter(order => order.status === 'served')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  
  // Calculate popular items
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number; dates: Date[] }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { 
        name: item.name, 
        quantity: 0, 
        revenue: 0, 
        dates: [] 
      }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      existing.dates.push(order.createdAt)
      itemSales.set(item.menuItemId, existing)
    })
  })

  const popularItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)

  // Calculate daily revenue for the filtered period
  const dateRange = startDate && endDate ? 
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) : 7
  
  const days = Array.from({ length: Math.min(dateRange, 30) }, (_, i) => {
    const date = new Date(startDate || new Date())
    if (!startDate) date.setDate(date.getDate() - i)
    else date.setDate(date.getDate() + i)
    return date.toDateString()
  }).reverse()

  const dailyRevenue = days.map(dateStr => {
    const dayOrders = completedOrders.filter(order => 
      order.createdAt.toDateString() === dateStr
    )
    const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: revenue,
      orders: dayOrders.length
    }
  })

  // Category analysis
  const categoryData = new Map<string, { revenue: number; count: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      const category = menuItem?.category || 'Other'
      const existing = categoryData.get(category) || { revenue: 0, count: 0 }
      existing.revenue += item.price * item.quantity
      existing.count += item.quantity
      categoryData.set(category, existing)
    })
  })

  const categoryChartData = Array.from(categoryData.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Payment method analytics for filtered data
  const paymentMethodData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const method = order.paymentMethod || 'cash' // default to cash if not specified
    const existing = paymentMethodData.get(method) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    paymentMethodData.set(method, existing)
  })

  const paymentMethodChartData = Array.from(paymentMethodData.entries())
    .map(([method, data]) => ({ method, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Order source analytics for filtered data
  const orderSourceData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const source = order.orderSource || 'direct_order' // default to direct_order if not specified
    const existing = orderSourceData.get(source) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    orderSourceData.set(source, existing)
  })

  const orderSourceChartData = Array.from(orderSourceData.entries())
    .map(([source, data]) => ({ 
      source: source === 'quick_order' ? 'Quick Order' : 'Regular Order', 
      sourceKey: source,
      ...data 
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    popularItems,
    dailyRevenue,
    categoryChartData,
    paymentMethodChartData,
    orderSourceChartData,
    totalOrders: filteredOrders.length,
    completedOrders: completedOrders.length,
    pendingOrders: filteredOrders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length,
    dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
  }
}

export function checkPremiumSubscription(restaurant: Restaurant): boolean {
  const subscriptionStatus = getSubscriptionStatus(restaurant)
  return subscriptionStatus.isValid && restaurant.subscriptionStatus === 'active'
}

export async function updateRestaurantStatus(restaurantName: string, updates: {
  restaurant_open?: boolean
  quick_order_approved?: boolean
  analytics_approved?: boolean
  customer_approved?: boolean
  inventory_management_approved?: boolean
  staff_management_approved?: boolean
}): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating restaurant status:', error)
    throw new Error('Failed to update restaurant status')
  }
}

export async function updateRestaurantBanner(restaurantName: string, bannerUrl: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      banner_image: bannerUrl,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating restaurant banner:', error)
    throw new Error('Failed to update restaurant banner')
  }
}

export async function syncTableStatusesWithOrders(restaurantName: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Get all orders and tables
    const [ordersSnapshot, tablesSnapshot] = await Promise.all([
      getDocs(collection(db, 'restaurants', restaurantId, 'orders')),
      getDocs(collection(db, 'restaurants', restaurantId, 'tables'))
    ])
    
    // Get active orders (not served or cancelled)
    const activeOrders = ordersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Order & { id: string }))
      .filter(order => order.status !== 'served' && order.status !== 'cancelled')
    
    // Group orders by table
    const ordersByTable = new Map<number, string>()
    activeOrders.forEach(order => {
      ordersByTable.set(order.tableNumber, order.id)
    })
    
    // Update each table
    const updatePromises = tablesSnapshot.docs.map(async (tableDoc) => {
      const tableData = tableDoc.data()
      const tableNumber = tableData.tableNumber
      const currentOrderId = ordersByTable.get(tableNumber)
      const shouldBeOccupied = Boolean(currentOrderId)
      
      // Only update if status doesn't match
      if (tableData.occupied !== shouldBeOccupied || tableData.currentOrderId !== currentOrderId) {
        console.log(`Syncing Table ${tableNumber}: ${shouldBeOccupied ? 'occupied' : 'available'}`)
        await updateDoc(tableDoc.ref, {
          occupied: shouldBeOccupied,
          currentOrderId: currentOrderId || null,
          updatedAt: serverTimestamp()
        })
      }
    })
    
    await Promise.all(updatePromises)
    console.log('Table statuses synced successfully')
  } catch (error) {
    console.error('Error syncing table statuses:', error)
    throw new Error('Failed to sync table statuses')
  }
} 