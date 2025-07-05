// firebase/types.ts
export interface Restaurant {
  id: string
  name: string
  adminEmail: string
  adminPhone?: string
  createdAt: Date
  updatedAt: Date
  address: string
  phone: string
  fssaiNo: string
  gstNo?: string
  description?: string
  status: 'active' | 'inactive'
  subscriptionStart: Date
  subscriptionEnd: Date
  subscriptionStatus: 'active' | 'expired' | 'trial'
  staff_management_code?: string
  inventory_management_code?: string
  inventory_management_approved?: boolean
  staff_management_approved?: boolean
  quick_order_approved: boolean
  analytics_approved: boolean
  customer_approved: boolean
  restaurant_open: boolean
  banner_image?: string
  // Tax settings
  taxEnabled?: boolean
  taxRate?: number
}

export interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  image?: string
  available: boolean
  createdAt: Date
  updatedAt: Date
  isBestSeller?: boolean
  isCombo?: boolean
  comboItems?: ComboItem[]
  ingredients?: MenuItemIngredient[]
  discount?: {
    isActive: boolean
    type: 'percentage' | 'fixed'
    value: number
    validFrom?: Date
    validTo?: Date
  }
}

export interface ComboItem {
  menuItemId: string
  name: string
  quantity: number
}

export interface Table {
  id: string
  tableNumber: number
  capacity: number
  occupied: boolean
  currentOrderId?: string
  updatedAt: Date
}

export interface Order {
  id: string
  tableNumber: number
  customerName: string
  customerPhone: string
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  notes?: string
  orderSource: 'qr_code' | 'quick_order' | 'walk_in' | 'direct_order'
  orderType: 'dine-in' | 'pickup'
  dailyOrderNumber?: number
  paymentMethod?: 'cash' | 'card' | 'upi' | 'other'
  statusHistory?: {
    status: Order['status']
    timestamp: Date
    duration?: number
  }[]
}

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalOrders: number
  lastVisit: Date
  favoriteItems: string[]
  createdAt: Date
}

export interface Notification {
  id: string
  type: 'new_order' | 'order_ready' | 'table_status' | 'customer_feedback'
  title: string
  message: string
  orderId?: string
  tableNumber?: number
  isRead: boolean
  createdAt: Date
}

export interface Discount {
  id: string
  name: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  isActive: boolean
  validFrom?: Date
  validTo?: Date
  createdAt: Date
  updatedAt: Date
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  unit: string
  currentStock: number
  minStockAlert: number
  cost: number
  supplier?: string
  createdAt: Date
  updatedAt: Date
}

export interface MenuItemIngredient {
  inventoryItemId: string
  name: string
  quantity: number
  unit: string
}

export interface StockTransaction {
  id: string
  inventoryItemId: string
  type: 'purchase' | 'usage' | 'adjustment'
  quantity: number
  reason: string
  orderId?: string
  createdAt: Date
  createdBy: string
}

export interface StaffMember {
  id: string
  name: string
  phone: string
  email?: string
  position: 'waiter' | 'chef' | 'cashier' | 'manager' | 'cleaner'
  joinDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceRecord {
  id: string
  staffId: string
  staffName: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: 'present' | 'absent' | 'half_day' | 'late'
  notes?: string
  createdAt: Date
  updatedAt: Date
} 