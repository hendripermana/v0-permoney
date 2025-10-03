/**
 * Layout Storage - Persist user dashboard layouts
 */

export interface WidgetConfig {
  id: string
  type: string
  title: string
  visible: boolean
  settings?: Record<string, any>
}

export interface GridLayout {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface DashboardLayout {
  userId: string
  layouts: {
    lg: GridLayout[]
    md: GridLayout[]
    sm: GridLayout[]
  }
  widgets: WidgetConfig[]
  version: number
}

const STORAGE_KEY = 'permoney_dashboard_layout'
const STORAGE_VERSION = 1

/**
 * Get default layout configuration
 */
export function getDefaultLayout(): DashboardLayout {
  return {
    userId: '',
    version: STORAGE_VERSION,
    layouts: {
      lg: [
        { i: 'account-summary', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
        { i: 'recent-transactions', x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
        { i: 'budget-overview', x: 6, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
        { i: 'spending-patterns', x: 0, y: 10, w: 6, h: 6, minW: 4, minH: 4 },
        { i: 'net-worth', x: 6, y: 10, w: 6, h: 6, minW: 4, minH: 4 },
      ],
      md: [
        { i: 'account-summary', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
        { i: 'recent-transactions', x: 0, y: 4, w: 8, h: 6, minW: 4, minH: 4 },
        { i: 'budget-overview', x: 0, y: 10, w: 8, h: 6, minW: 4, minH: 4 },
        { i: 'spending-patterns', x: 0, y: 16, w: 8, h: 6, minW: 4, minH: 4 },
        { i: 'net-worth', x: 0, y: 22, w: 8, h: 6, minW: 4, minH: 4 },
      ],
      sm: [
        { i: 'account-summary', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
        { i: 'recent-transactions', x: 0, y: 4, w: 4, h: 6, minW: 4, minH: 4 },
        { i: 'budget-overview', x: 0, y: 10, w: 4, h: 6, minW: 4, minH: 4 },
        { i: 'spending-patterns', x: 0, y: 16, w: 4, h: 6, minW: 4, minH: 4 },
        { i: 'net-worth', x: 0, y: 22, w: 4, h: 6, minW: 4, minH: 4 },
      ],
    },
    widgets: [
      { id: 'account-summary', type: 'account-summary', title: 'Account Summary', visible: true },
      { id: 'recent-transactions', type: 'transactions', title: 'Recent Transactions', visible: true },
      { id: 'budget-overview', type: 'budget', title: 'Budget Overview', visible: true },
      { id: 'spending-patterns', type: 'spending', title: 'Spending Patterns', visible: true },
      { id: 'net-worth', type: 'net-worth', title: 'Net Worth', visible: true },
    ],
  }
}

/**
 * Load layout from localStorage
 */
export function loadLayout(userId: string): DashboardLayout {
  if (typeof window === 'undefined') {
    return getDefaultLayout()
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (!stored) {
      return getDefaultLayout()
    }

    const layout: DashboardLayout = JSON.parse(stored)
    
    // Version check
    if (layout.version !== STORAGE_VERSION) {
      return getDefaultLayout()
    }

    return layout
  } catch (error) {
    console.error('Failed to load dashboard layout:', error)
    return getDefaultLayout()
  }
}

/**
 * Save layout to localStorage
 */
export function saveLayout(layout: DashboardLayout): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      `${STORAGE_KEY}_${layout.userId}`,
      JSON.stringify(layout)
    )
  } catch (error) {
    console.error('Failed to save dashboard layout:', error)
  }
}

/**
 * Reset layout to default
 */
export function resetLayout(userId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
  } catch (error) {
    console.error('Failed to reset dashboard layout:', error)
  }
}
