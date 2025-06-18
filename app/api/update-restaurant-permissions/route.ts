import { updateRestaurantStatus } from '@/firebase/restaurant-service'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔧 Updating existing BY_THE_WAY restaurant with missing permission fields...')
    
    // Update the restaurant document with missing fields
    await updateRestaurantStatus('BY_THE_WAY', {
      quick_order_approved: false,        // Initially false
      analytics_approved: false,          // Initially false  
      customer_approved: true,            // Initially true
      inventory_management_approved: false, // Set to false as requested
      staff_management_approved: false     // Set to false as requested
    })
    
    console.log('✅ Restaurant permissions updated successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Restaurant permissions updated successfully!',
      permissions: {
        quick_order_approved: false,
        analytics_approved: false,  
        customer_approved: true,
        inventory_management_approved: false,
        staff_management_approved: false
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