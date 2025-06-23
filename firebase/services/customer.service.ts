import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config'
import { Customer } from '../types'
import { getRestaurantCollectionName, normalizePhoneNumber } from '../utils'

export async function registerCustomerForOrder(restaurantName: string, customerData: {
  name: string
  phone: string
  lastVisit: Date
  orderItems: string[]
}): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const normalizedPhone = normalizePhoneNumber(customerData.phone)
    const customerId = `customer_${normalizedPhone}`
    
    const customerRef = doc(db, 'restaurants', restaurantId, 'customers', customerId)
    const existingCustomer = await getDoc(customerRef)
    
    if (existingCustomer.exists()) {
      // Update existing customer visit
      const currentData = existingCustomer.data() as Customer
      const updatedFavorites = [...new Set([...currentData.favoriteItems, ...customerData.orderItems])]
      
      await updateDoc(customerRef, {
        lastVisit: customerData.lastVisit,
        favoriteItems: updatedFavorites.slice(0, 10), // Keep top 10 favorites
        updatedAt: serverTimestamp()
      })
      
      return {
        ...currentData,
        lastVisit: customerData.lastVisit,
        favoriteItems: updatedFavorites
      }
    } else {
      // Create new customer
      const newCustomer: Omit<Customer, 'id'> = {
        name: customerData.name,
        phone: normalizedPhone,
        totalOrders: 0, // Don't count until order is completed
        lastVisit: customerData.lastVisit,
        favoriteItems: customerData.orderItems.slice(0, 10),
        createdAt: new Date()
      }
      
      await setDoc(customerRef, {
        ...newCustomer,
        createdAt: serverTimestamp()
      })
      
      return { id: customerId, ...newCustomer }
    }
  } catch (error) {
    console.error('Error registering customer:', error)
    throw new Error('Failed to register customer')
  }
}

export async function completeCustomerOrder(restaurantName: string, customerData: {
  name: string
  phone: string
  orderItems: string[]
}): Promise<Customer> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const normalizedPhone = normalizePhoneNumber(customerData.phone)
    const customerId = `customer_${normalizedPhone}`
    
    const customerRef = doc(db, 'restaurants', restaurantId, 'customers', customerId)
    const existingCustomer = await getDoc(customerRef)
    
    if (existingCustomer.exists()) {
      const currentData = existingCustomer.data() as Customer
      const updatedFavorites = [...new Set([...currentData.favoriteItems, ...customerData.orderItems])]
      
      await updateDoc(customerRef, {
        totalOrders: currentData.totalOrders + 1,
        favoriteItems: updatedFavorites.slice(0, 10),
        updatedAt: serverTimestamp()
      })
      
      return {
        ...currentData,
        totalOrders: currentData.totalOrders + 1,
        favoriteItems: updatedFavorites
      }
    } else {
      // Create new customer if somehow doesn't exist
      const newCustomer: Omit<Customer, 'id'> = {
        name: customerData.name,
        phone: normalizedPhone,
        totalOrders: 1,
        lastVisit: new Date(),
        favoriteItems: customerData.orderItems.slice(0, 10),
        createdAt: new Date()
      }
      
      await setDoc(customerRef, {
        ...newCustomer,
        createdAt: serverTimestamp()
      })
      
      return { id: customerId, ...newCustomer }
    }
  } catch (error) {
    console.error('Error completing customer order:', error)
    throw new Error('Failed to complete customer order')
  }
}

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
      lastVisit: doc.data().lastVisit?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Customer[]
    callback(customers)
  })
} 