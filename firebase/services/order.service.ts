import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config'
import { Order, OrderItem } from '../types'
import { getRestaurantCollectionName } from '../utils'
// Import functions from other services - these are resolved at runtime
// import { registerCustomerForOrder, completeCustomerOrder } from './customer.service'
// import { updateTableStatus } from './table.service'  
// import { createNotification } from './notification.service'

// Inline the key functions to avoid circular dependencies during refactoring

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

    return {
      id: docRef.id,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('Error creating order:', error)
    throw new Error('Failed to create order')
  }
}

export async function updateOrderStatus(restaurantName: string, orderId: string, status: Order['status']): Promise<void> {
  try {
    console.log(`🔄 Updating order ${orderId} status to: ${status}`)
    
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId)
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    }

    // Add status history entry
    const statusHistoryEntry = {
      status,
      timestamp: Timestamp.now(),
      duration: 0 // This would be calculated based on previous status
    }

    await updateDoc(orderRef, updateData)
    console.log(`✅ Order ${orderId} status updated to ${status}`)
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
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      statusHistory: doc.data().statusHistory?.map((entry: any) => ({
        ...entry,
        timestamp: entry.timestamp?.toDate() || new Date()
      })) || []
    })) as Order[]
    callback(orders)
  })
}

export async function processIncomingOrder(restaurantName: string, orderData: {
  customerName: string
  customerPhone: string
  tableNumber: number
  items: OrderItem[]
  totalAmount: number
  notes?: string
}): Promise<void> {
  try {
    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      ...orderData,
      status: 'pending',
      orderSource: 'quick_order'
    }

    await createOrder(restaurantName, order)
    console.log('✅ Incoming order processed successfully')
  } catch (error) {
    console.error('Error processing incoming order:', error)
    throw new Error('Failed to process incoming order')
  }
} 