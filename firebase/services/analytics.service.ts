import { Order, MenuItem } from '../types'

export function getOrderAnalytics(orders: Order[], menuItems: MenuItem[]) {
  const completedOrders = orders.filter(order => order.status === 'served')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  
  // Calculate popular items
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { name: item.name, quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      itemSales.set(item.menuItemId, existing)
    })
  })

  const popularItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)

  // Calculate daily revenue for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toDateString()
  }).reverse()

  const dailyRevenue = last7Days.map(dateStr => {
    const dayOrders = completedOrders.filter(order => 
      order.createdAt.toDateString() === dateStr
    )
    const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: revenue,
      orders: dayOrders.length
    }
  })

  // Category analysis
  const categoryData = new Map<string, { revenue: number; count: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      const category = menuItem?.category || 'Other'
      const existing = categoryData.get(category) || { revenue: 0, count: 0 }
      existing.revenue += item.price * item.quantity
      existing.count += item.quantity
      categoryData.set(category, existing)
    })
  })

  const categoryChartData = Array.from(categoryData.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    popularItems,
    dailyRevenue,
    categoryChartData,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    pendingOrders: orders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length
  }
}

export function getOrderAnalyticsWithDateFilter(
  orders: Order[], 
  menuItems: MenuItem[], 
  startDate?: Date, 
  endDate?: Date, 
  menuItemId?: string
) {
  // Filter orders by date range
  let filteredOrders = orders
  if (startDate || endDate) {
    filteredOrders = orders.filter(order => {
      const orderDate = order.createdAt
      if (startDate && orderDate < startDate) return false
      if (endDate && orderDate > endDate) return false
      return true
    })
  }

  // Filter by specific menu item if provided
  if (menuItemId) {
    filteredOrders = filteredOrders.filter(order => 
      order.items.some(item => item.menuItemId === menuItemId)
    )
  }

  const completedOrders = filteredOrders.filter(order => order.status === 'served')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  
  // Calculate popular items
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number; dates: Date[] }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = itemSales.get(item.menuItemId) || { 
        name: item.name, 
        quantity: 0, 
        revenue: 0, 
        dates: [] 
      }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      existing.dates.push(order.createdAt)
      itemSales.set(item.menuItemId, existing)
    })
  })

  const popularItems = Array.from(itemSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)

  // Calculate daily revenue for the filtered period
  const dateRange = startDate && endDate ? 
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) : 7
  
  const days = Array.from({ length: Math.min(dateRange, 30) }, (_, i) => {
    const date = new Date(startDate || new Date())
    if (!startDate) date.setDate(date.getDate() - i)
    else date.setDate(date.getDate() + i)
    return date.toDateString()
  }).reverse()

  const dailyRevenue = days.map(dateStr => {
    const dayOrders = completedOrders.filter(order => 
      order.createdAt.toDateString() === dateStr
    )
    const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: revenue,
      orders: dayOrders.length
    }
  })

  // Category analysis
  const categoryData = new Map<string, { revenue: number; count: number }>()
  
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      const category = menuItem?.category || 'Other'
      const existing = categoryData.get(category) || { revenue: 0, count: 0 }
      existing.revenue += item.price * item.quantity
      existing.count += item.quantity
      categoryData.set(category, existing)
    })
  })

  const categoryChartData = Array.from(categoryData.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Payment method analytics for filtered data
  const paymentMethodData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const method = order.paymentMethod || 'cash'
    const existing = paymentMethodData.get(method) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    paymentMethodData.set(method, existing)
  })

  const paymentMethodChartData = Array.from(paymentMethodData.entries())
    .map(([method, data]) => ({ method, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Order source analytics for filtered data
  const orderSourceData = new Map<string, { count: number; revenue: number }>()
  completedOrders.forEach(order => {
    const source = order.orderSource || 'direct_order'
    const existing = orderSourceData.get(source) || { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += order.totalAmount
    orderSourceData.set(source, existing)
  })

  const orderSourceChartData = Array.from(orderSourceData.entries())
    .map(([source, data]) => ({ 
      source: source === 'quick_order' ? 'Quick Order' : 'Regular Order', 
      sourceKey: source,
      ...data 
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    popularItems,
    dailyRevenue,
    categoryChartData,
    paymentMethodChartData,
    orderSourceChartData,
    totalOrders: filteredOrders.length,
    completedOrders: completedOrders.length,
    pendingOrders: filteredOrders.filter(order => ['pending', 'preparing', 'ready'].includes(order.status)).length,
    dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
  }
} 