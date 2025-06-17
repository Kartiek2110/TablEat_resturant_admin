// scripts/initialize-restaurant.ts
import { 
  createRestaurant, 
  addMenuItem,
  type MenuItem,
  type Restaurant 
} from '@/firebase/restaurant-service'

// Initialize the "BY_THE_WAY" restaurant
export async function initializeByTheWayRestaurant() {
  try {
     
    
    // Create the restaurant
    const restaurant = await createRestaurant('BY_THE_WAY', 'admin@bytheway.com')
   

    // Add sample menu items
    for (const menuItem of sampleMenuItems) {
      try {
        await addMenuItem('BY_THE_WAY', menuItem)
       
      } catch (error) {
        console.error(`Failed to add menu item ${menuItem.name}:`, error)
      }
    }

   
    return restaurant
  } catch (error) {
    console.error('Error initializing restaurant:', error)
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