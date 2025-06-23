import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config'
import { Restaurant } from '../types'
import { getRestaurantCollectionName } from '../utils'

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
      inventory_management_approved: false,
      staff_management_approved: false,
      quick_order_approved: false,
      analytics_approved: false,
      customer_approved: true,
      restaurant_open: true
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

export async function renewSubscription(restaurantName: string, months: number = 1): Promise<void> {
  try {
    const restaurantId = getRestaurantCollectionName(restaurantName)
    const restaurant = await getRestaurant(restaurantName)
    
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }

    const newEndDate = new Date(restaurant.subscriptionEnd)
    newEndDate.setMonth(newEndDate.getMonth() + months)

    await updateDoc(doc(db, 'restaurants', restaurantId), {
      subscriptionEnd: newEndDate,
      subscriptionStatus: 'active',
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error renewing subscription:', error)
    throw new Error('Failed to renew subscription')
  }
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