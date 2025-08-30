const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

export interface DashboardData {
  summary: {
    netWorth: Money
    totalAssets: Money
    totalLiabilities: Money
    monthlyIncome: Money
    monthlyExpenses: Money
    monthlySavings: Money
    savingsRate: number
  }
  accounts: Account[]
  recentTransactions: Transaction[]
  netWorthChart: NetWorthPoint[]
  cashflowChart: CashflowChart
  insights: Insight[]
  gratitudeSummary: GratitudeSummary | null
}

export interface Money {
  cents: bigint
  currency: string
  amount: number
  formatted: string
}

export interface Account {
  id: string
  householdId: string
  name: string
  type: string
  subtype: string
  currency: string
  accountNumber: string
  balance: Money
  calculatedBalance: Money
  isActive: boolean
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  householdId: string
  amount: Money
  originalAmount?: Money
  exchangeRate?: number
  description: string
  category: string
  merchant: string
  merchantData: any
  merchantName: string
  merchantLogoUrl: string
  merchantColor: string
  date: string
  account: Account
  transferAccount?: Account
  receiptUrl?: string
  tags: string[]
  splits: any[]
  ledgerEntries: any[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface NetWorthPoint {
  date: string
  totalAssets: Money
  totalLiabilities: Money
  netWorth: Money
}

export interface CashflowChart {
  points: Array<{
    date: string
    income: Money
    expenses: Money
    netFlow: Money
  }>
  totalIncome: Money
  totalExpenses: Money
  netCashflow: Money
}

export interface Insight {
  id: string
  type: string
  title: string
  description: string
  data: string
  actionable: boolean
  priority: string
  createdAt: string
  validUntil?: string
  isDismissed: boolean
}

export interface GratitudeSummary {
  totalEntries: number
  totalEstimatedValue: Money
  byType: Array<{
    type: string
    count: number
    estimatedValue: Money
  }>
  topGivers: string[]
}

export interface AnalyticsFilters {
  startDate: string
  endDate: string
  categoryIds?: string[]
  accountIds?: string[]
  merchantIds?: string[]
  tags?: string[]
  amountRange?: { min: number; max: number }
  currency?: string
  includeTransfers?: boolean
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken")
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return response.json()
      }

      return response.text() as any
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Dashboard API
  async getDashboardData(householdId: string, filters?: AnalyticsFilters): Promise<DashboardData> {
    const defaultFilters: AnalyticsFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      includeTransfers: false,
      ...filters,
    }

    return this.request<DashboardData>(`/analytics/${householdId}/dashboard`, {
      method: "POST",
      body: JSON.stringify(defaultFilters),
    })
  }

  // Accounts API
  async getAccounts(householdId: string): Promise<Account[]> {
    return this.request<Account[]>(`/accounts?householdId=${householdId}`)
  }

  async getAccountsGrouped(householdId: string): Promise<any> {
    return this.request(`/accounts/grouped?householdId=${householdId}`)
  }

  async getNetWorth(householdId: string, currency = "IDR"): Promise<any> {
    return this.request(`/accounts/net-worth?currency=${currency}&householdId=${householdId}`)
  }

  async getAccountStats(householdId: string): Promise<any> {
    return this.request(`/accounts/stats?householdId=${householdId}`)
  }

  // Transactions API
  async getTransactions(householdId: string, params?: any): Promise<any> {
    const queryParams = new URLSearchParams({
      householdId,
      ...params,
    }).toString()
    return this.request(`/transactions?${queryParams}`)
  }

  async createTransaction(householdId: string, data: any): Promise<Transaction> {
    return this.request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify({ ...data, householdId }),
    })
  }

  // Analytics API
  async getSpendingAnalytics(householdId: string, filters: AnalyticsFilters): Promise<any> {
    return this.request(`/analytics/${householdId}/spending`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getCashflowAnalysis(householdId: string, filters: AnalyticsFilters): Promise<any> {
    return this.request(`/analytics/${householdId}/cashflow`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getNetWorthAnalysis(householdId: string, filters: AnalyticsFilters): Promise<any> {
    return this.request(`/analytics/${householdId}/net-worth`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  // Monitoring API
  async getMonitoringDashboard(timeRange = "1h"): Promise<any> {
    return this.request(`/monitoring/dashboard?timeRange=${timeRange}`)
  }

  // Islamic Finance API
  async getIslamicFinanceDashboard(householdId: string): Promise<any> {
    return this.request(`/islamic-finance/dashboard/${householdId}`)
  }

  // Auth API
  async login(email: string, password: string): Promise<any> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any): Promise<any> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", {
      method: "POST",
    })
    localStorage.removeItem("accessToken")
    localStorage.removeItem("authToken")
  }

  async refreshToken(): Promise<any> {
    return this.request("/auth/refresh", {
      method: "POST",
    })
  }

  // Household API
  async getHouseholds(): Promise<any[]> {
    return this.request<any[]>("/households")
  }

  async getCurrentHousehold(): Promise<any> {
    const households = await this.getHouseholds()
    return households[0] // Return first household for now
  }

  // Budgets API
  async getBudgets(householdId: string): Promise<any[]> {
    return this.request<any[]>(`/budgets?householdId=${householdId}`)
  }

  async createBudget(householdId: string, data: any): Promise<any> {
    return this.request("/budgets", {
      method: "POST",
      body: JSON.stringify({ ...data, householdId }),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.request("/health")
  }
}

export const apiClient = new ApiClient()
export default apiClient
