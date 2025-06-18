// scripts/initialize-restaurant.ts
import { 
  createRestaurant, 
  addMenuItem,
  updateRestaurantStatus,
  type MenuItem,
  type Restaurant 
} from '@/firebase/restaurant-service'

// Initialize the "BY_THE_WAY" restaurant
export async function initializeByTheWayRestaurant() {
  try {
    console.log('🏪 Creating BY_THE_WAY restaurant with default permissions...')
    
    // Create the restaurant - now with all default permission fields
    const restaurant = await createRestaurant('BY_THE_WAY', 'by_the_way_admin@gmail.com')
    console.log('✅ Restaurant created successfully:', restaurant.name)
    console.log('📋 Default Permissions Set:')
    console.log('  • Quick Order: ❌ (Requires Admin Approval)')
    console.log('  • Analytics: ❌ (Requires Admin Approval)')
    console.log('  • Customer Management: ✅ (Enabled)')
    console.log('  • Inventory: ❌ (Requires Admin Approval)')
    console.log('  • Staff Management: ❌ (Requires Admin Approval)')
    console.log('  • Restaurant Status: 🟢 (Open)')

    // Add sample menu items
    console.log('🍽️ Adding sample menu items...')
    for (const menuItem of sampleMenuItems) {
      try {
        await addMenuItem('BY_THE_WAY', menuItem)
        console.log(`  ✅ Added: ${menuItem.name}`)
      } catch (error) {
        console.error(`  ❌ Failed to add menu item ${menuItem.name}:`, error)
      }
    }

    console.log('🎉 Restaurant initialization completed successfully!')
    return restaurant
  } catch (error) {
    console.error('❌ Error initializing restaurant:', error)
    throw error
  }
}

// Function to update existing restaurant with missing permission fields
export async function updateExistingRestaurantPermissions() {
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
    console.log('📋 Updated Permissions:')
    console.log('  • Quick Order: ❌ (false)')
    console.log('  • Analytics: ❌ (false)')
    console.log('  • Customer Management: ✅ (true)')
    console.log('  • Inventory: ❌ (false)')
    console.log('  • Staff Management: ❌ (false)')
    console.log('  • Restaurant Status: 🟢 (remains open)')
    
    return true
  } catch (error) {
    console.error('❌ Error updating restaurant permissions:', error)
    throw error
  }
}

// Sample data for BY_THE_WAY restaurant
export const sampleMenuItems: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Truffle Mushroom Pizza',
    description: 'Wood-fired pizza with truffle oil, wild mushrooms, and fresh mozzarella',
    price: 18.99,
    category: 'Pizza',
    available: true,
    isBestSeller: true
  },
  {
    name: 'Grilled Salmon Bowl',
    description: 'Atlantic salmon with quinoa, roasted vegetables, and lemon herb sauce',
    price: 24.99,
    category: 'Main Course',
    available: true,
    isBestSeller: false
  },
  {
    name: 'Avocado Toast Deluxe',
    description: 'Sourdough toast with smashed avocado, poached egg, and microgreens',
    price: 14.99,
    category: 'Breakfast',
    available: true,
    isBestSeller: false
  },
  {
    name: 'Craft Burger',
    description: 'Wagyu beef burger with aged cheddar, caramelized onions, and special sauce',
    price: 19.99,
    category: 'Burgers',
    available: true,
    isBestSeller: true
  },
  {
    name: 'Caesar Salad',
    description: 'Romaine lettuce with parmesan, croutons, and house-made caesar dressing',
    price: 12.99,
    category: 'Salads',
    available: true,
    isBestSeller: false
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 9.99,
    category: 'Desserts',
    available: true,
    isBestSeller: false
  },
]

// Function to run the initialization
export async function runInitialization() {
  try {
    const restaurant = await initializeByTheWayRestaurant()
   
    return restaurant
  } catch (error) {
    console.error('❌ Initialization failed:', error)
    throw error
  }
}

// Export for use in other files
export { runInitialization as default } 