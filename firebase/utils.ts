import { MenuItem, Restaurant } from './types'

// Helper function to get restaurant collection name
export function getRestaurantCollectionName(restaurantName: string): string {
  return restaurantName.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase()
}

// Normalize phone number for consistent storage
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Calculate discount prices for menu items
export function calculateDiscountedPrice(menuItem: MenuItem): { 
  originalPrice: number
  discountedPrice: number
  discountAmount: number
  hasDiscount: boolean 
} {
  const originalPrice = menuItem.price
  
  if (!menuItem.discount?.isActive) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discountAmount: 0,
      hasDiscount: false
    }
  }

  const discount = menuItem.discount
  const now = new Date()
  
  // Check if discount is within valid date range
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
    discountAmount = discount.value
  }

  const discountedPrice = Math.max(0, originalPrice - discountAmount)

  return {
    originalPrice,
    discountedPrice,
    discountAmount,
    hasDiscount: true
  }
}

// Get discount display text for menu items
export function getDiscountDisplayText(menuItem: MenuItem): string | null {
  const { hasDiscount } = calculateDiscountedPrice(menuItem)
  
  if (!hasDiscount || !menuItem.discount) return null

  const discount = menuItem.discount
  if (discount.type === 'percentage') {
    return `${discount.value}% OFF`
  } else {
    return `₹${discount.value} OFF`
  }
}

// Check if restaurant has premium subscription
export function checkPremiumSubscription(restaurant: Restaurant): boolean {
  const subscriptionStatus = getSubscriptionStatus(restaurant)
  return subscriptionStatus.isValid && restaurant.subscriptionStatus === 'active'
}

// Get subscription status details
export function getSubscriptionStatus(restaurant: Restaurant): {
  isValid: boolean
  daysRemaining: number
  status: 'active' | 'expired' | 'trial'
} {
  const now = new Date()
  const endDate = restaurant.subscriptionEnd
  
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    isValid: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    status: daysRemaining > 0 ? restaurant.subscriptionStatus : 'expired'
  }
} 