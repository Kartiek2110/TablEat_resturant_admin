import { useState, useEffect, useCallback } from 'react'
import {
  Restaurant,
  MenuItem,
  Table,
  Discount,
  subscribeToMenuItems,
  subscribeToTables,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateTableStatus,
  getRestaurant,
  type Restaurant as RestaurantType
} from '@/firebase/restaurant-service'

// Hook for managing restaurant data
export const useRestaurant = (restaurantName: string) => {
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantName) return

    setLoading(true)
    setError(null)

    const loadRestaurant = async () => {
      try {
        const restaurantData = await getRestaurant(restaurantName)
        setRestaurant(restaurantData)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load restaurant')
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [restaurantName])

  const updateRestaurant = useCallback(
    async (updates: Partial<RestaurantType>) => {
      if (!restaurantName) return
      try {
        // Note: You would need to implement updateRestaurant in firebase service
        console.log('Update restaurant not implemented yet', updates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update restaurant')
      }
    },
    [restaurantName]
  )

  return {
    restaurant,
    loading,
    error,
    updateRestaurant,
  }
}

// Hook for managing menu data
export const useMenu = (restaurantName: string) => {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantName) return

    setLoading(true)
    setError(null)

    // Set up real-time listener
    const unsubscribe = subscribeToMenuItems(restaurantName, (menuData) => {
      setMenu(menuData)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [restaurantName])

  const addMenuItemHandler = useCallback(
    async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        await addMenuItem(restaurantName, menuItem)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add menu item')
      }
    },
    [restaurantName]
  )

  const updateMenuItemHandler = useCallback(async (menuItemId: string, updates: Partial<MenuItem>) => {
    try {
      await updateMenuItem(restaurantName, menuItemId, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu item')
    }
  }, [restaurantName])

  const deleteMenuItemHandler = useCallback(async (menuItemId: string) => {
    try {
      await deleteMenuItem(restaurantName, menuItemId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item')
    }
  }, [restaurantName])

  return {
    menu,
    loading,
    error,
    addMenuItem: addMenuItemHandler,
    updateMenuItem: updateMenuItemHandler,
    deleteMenuItem: deleteMenuItemHandler,
  }
}

// Hook for managing table data
export const useTables = (restaurantName: string) => {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantName) return

    setLoading(true)
    setError(null)

    // Set up real-time listener
    const unsubscribe = subscribeToTables(restaurantName, (tablesData) => {
      setTables(tablesData)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [restaurantName])

  const addTable = useCallback(
    async (table: { tableNumber: number; capacity: number }) => {
      try {
        // Note: You would need to implement addTable in firebase service
        console.log('Add table not implemented yet', table)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add table')
      }
    },
    [restaurantName]
  )

  const updateTable = useCallback(async (tableNumber: number, occupied: boolean) => {
    try {
      await updateTableStatus(restaurantName, tableNumber, occupied)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update table')
    }
  }, [restaurantName])

  const deleteTable = useCallback(async (tableId: string) => {
    try {
      // Note: You would need to implement deleteTable in firebase service
      console.log('Delete table not implemented yet', tableId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table')
    }
  }, [])

  return {
    tables,
    loading,
    error,
    addTable,
    updateTable,
    deleteTable,
  }
}

// Hook for managing discount data (simplified for now)
export const useDiscounts = (restaurantName: string) => {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(false) // Set to false since no real implementation
  const [error, setError] = useState<string | null>(null)

  const addDiscount = useCallback(
    async (discount: Omit<Discount, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Note: You would need to implement discount management in firebase service
        console.log('Add discount not implemented yet', discount)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add discount')
      }
    },
    [restaurantName]
  )

  const updateDiscount = useCallback(async (discountId: string, updates: Partial<Discount>) => {
    try {
      // Note: You would need to implement discount management in firebase service
      console.log('Update discount not implemented yet', discountId, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update discount')
    }
  }, [])

  const deleteDiscount = useCallback(async (discountId: string) => {
    try {
      // Note: You would need to implement discount management in firebase service
      console.log('Delete discount not implemented yet', discountId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete discount')
    }
  }, [])

  return {
    discounts,
    loading,
    error,
    addDiscount,
    updateDiscount,
    deleteDiscount,
  }
}

// Hook for managing all restaurant data
export const useRestaurantManagement = (restaurantName: string) => {
  const restaurantData = useRestaurant(restaurantName)
  const menuData = useMenu(restaurantName)
  const tablesData = useTables(restaurantName)
  const discountsData = useDiscounts(restaurantName)

  const initializeRestaurant = useCallback(
    async (restaurantInfo: Omit<RestaurantType, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        // Note: You would need to implement restaurant initialization
        console.log('Initialize restaurant not implemented yet', restaurantInfo)
        throw new Error('Restaurant initialization not implemented')
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to initialize restaurant')
      }
    },
    []
  )

  const isLoading = restaurantData.loading || menuData.loading || tablesData.loading || discountsData.loading

  const hasError = restaurantData.error || menuData.error || tablesData.error || discountsData.error

  return {
    // Restaurant data
    restaurant: restaurantData.restaurant,
    updateRestaurant: restaurantData.updateRestaurant,
    
    // Menu data
    menu: menuData.menu,
    addMenuItem: menuData.addMenuItem,
    updateMenuItem: menuData.updateMenuItem,
    deleteMenuItem: menuData.deleteMenuItem,
    
    // Tables data
    tables: tablesData.tables,
    addTable: tablesData.addTable,
    updateTable: tablesData.updateTable,
    deleteTable: tablesData.deleteTable,
    
    // Discounts data
    discounts: discountsData.discounts,
    addDiscount: discountsData.addDiscount,
    updateDiscount: discountsData.updateDiscount,
    deleteDiscount: discountsData.deleteDiscount,
    
    // Utility functions
    initializeRestaurant,
    
    // Loading and error states
    isLoading,
    hasError,
  }
} 