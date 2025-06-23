// firebase/restaurant-service-optimized.ts
// Optimized and refactored restaurant service with modular architecture

// Re-export all types
export * from './types'

// Re-export all utility functions
export * from './utils'

// Re-export all service functions
export * from './services/restaurant.service'
export * from './services/menu.service'
export * from './services/table.service'
export * from './services/order.service'
export * from './services/customer.service'
export * from './services/notification.service'
export * from './services/analytics.service'

// Additional services that would be created for complete refactoring
// Note: These would need to be implemented if the original file had more functions
// export * from './services/inventory.service'
// export * from './services/staff.service' 