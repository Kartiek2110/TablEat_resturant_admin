import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config'
import { Table, Order } from '../types'
import { getRestaurantCollectionName } from '../utils'

export async function updateTableStatus(restaurantName: string, tableNumber: number, occupied: boolean, currentOrderId?: string): Promise<void> {
  try {
    console.log(`🔄 Updating Table ${tableNumber} status: ${occupied ? 'occupied' : 'available'}`)
    
    const restaurantId = getRestaurantCollectionName(restaurantName)
    
    // Get all tables to find the one with matching table number
    const tablesSnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'tables'))
    const tableDoc = tablesSnapshot.docs.find(doc => doc.data().tableNumber === tableNumber)
    
    if (!tableDoc) {
      throw new Error(`Table ${tableNumber} not found`)
    }

    const updateData: any = {
      occupied,
      updatedAt: serverTimestamp()
    }

    if (occupied && currentOrderId) {
      updateData.currentOrderId = currentOrderId
      console.log(`🔗 Linking Table ${tableNumber} to order ${currentOrderId}`)
    } else if (!occupied) {
      updateData.currentOrderId = null
      console.log(`🔓 Clearing order link for Table ${tableNumber}`)
    }

    await updateDoc(tableDoc.ref, updateData)
    console.log(`✅ Table ${tableNumber} status updated successfully`)
  } catch (error) {
    console.error('Error updating table status:', error)
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