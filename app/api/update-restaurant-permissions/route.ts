import { updateRestaurantStatus, getRestaurant } from '@/firebase/restaurant-service'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Check if Firebase is properly initialized
    const { db } = await import('@/firebase/config')
    if (!db) {
      console.warn('⚠️ Firebase not initialized - skipping permission update')
      return NextResponse.json({
        success: false,
        error: 'Firebase not properly configured'
      }, { status: 503 })
    }

    
    // First, get the current restaurant data
    const currentRestaurant = await getRestaurant('BY_THE_WAY')
    
    if (!currentRestaurant) {
      return NextResponse.json({
        success: false,
        error: 'Restaurant not found'
      }, { status: 404 })
    }
    
    // Only update fields that are missing or undefined, preserve existing true values
    const updates: any = {}
    
    // Only add fields that don't exist or are undefined
    if (currentRestaurant.quick_order_approved === undefined) {
      updates.quick_order_approved = false
    }
    if (currentRestaurant.analytics_approved === undefined) {
      updates.analytics_approved = false
    }
    if (currentRestaurant.customer_approved === undefined) {
      updates.customer_approved = true // Default to true for customer management
    }
    if (currentRestaurant.inventory_management_approved === undefined) {
      updates.inventory_management_approved = false
    }
    if (currentRestaurant.staff_management_approved === undefined) {
      updates.staff_management_approved = false
    }
    
    // If no updates are needed, return success
    if (Object.keys(updates).length === 0) {
      console.log('✅ All permission fields already exist - no updates needed!')
      return NextResponse.json({
        success: true,
        message: 'All permission fields already exist',
        permissions: {
          quick_order_approved: currentRestaurant.quick_order_approved,
          analytics_approved: currentRestaurant.analytics_approved,
          customer_approved: currentRestaurant.customer_approved,
          inventory_management_approved: currentRestaurant.inventory_management_approved,
          staff_management_approved: currentRestaurant.staff_management_approved
        }
      })
    }
    
    // Update only the missing fields
    await updateRestaurantStatus('BY_THE_WAY', updates)
    
    console.log('✅ Restaurant permissions updated successfully!')
    console.log('📋 Added missing fields:', updates)
    
    return NextResponse.json({
      success: true,
      message: 'Missing permission fields added successfully!',
      addedFields: updates,
      currentPermissions: {
        quick_order_approved: currentRestaurant.quick_order_approved ?? updates.quick_order_approved,
        analytics_approved: currentRestaurant.analytics_approved ?? updates.analytics_approved,
        customer_approved: currentRestaurant.customer_approved ?? updates.customer_approved,
        inventory_management_approved: currentRestaurant.inventory_management_approved ?? updates.inventory_management_approved,
        staff_management_approved: currentRestaurant.staff_management_approved ?? updates.staff_management_approved
      }
    })
  } catch (error) {
    console.error('❌ Error updating restaurant permissions:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update restaurant permissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 