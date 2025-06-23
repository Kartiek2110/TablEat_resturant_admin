import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config'
import { MenuItem } from '../types'
import { getRestaurantCollectionName } from '../utils'

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