import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config'
import { Notification } from '../types'
import { getRestaurantCollectionName } from '../utils'

export async function createNotification(restaurantName: string, notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await addDoc(collection(db, 'restaurants', restaurantId, 'notifications'), {
      ...notification,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

export async function markNotificationAsRead(restaurantName: string, notificationId: string): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    await updateDoc(doc(db, 'restaurants', restaurantId, 'notifications', notificationId), {
      isRead: true
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
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