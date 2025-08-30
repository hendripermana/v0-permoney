const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  // Accounts API
  async getAccounts(filters?: any) {
    return this.request<any[]>("/accounts", {
      method: "GET",
      ...(filters && { body: JSON.stringify(filters) }),
    })
  }

  async getAccountById(id: string) {
    return this.request<any>(`/accounts/${id}`)
  }

  async createAccount(data: any) {
    return this.request<any>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateAccount(id: string, data: any) {
    return this.request<any>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteAccount(id: string) {
    return this.request<any>(`/accounts/${id}`, {
      method: "DELETE",
    })
  }

  async getAccountStats() {
    return this.request<any>("/accounts/stats")
  }

  async getNetWorth(currency = "IDR") {
    return this.request<any>(`/accounts/net-worth?currency=${currency}`)
  }

  // Transactions API
  async getTransactions(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return this.request<any[]>(`/transactions?${params.toString()}`)
  }

  async getTransactionById(id: string) {
    return this.request<any>(`/transactions/${id}`)
  }

  async createTransaction(data: any) {
    return this.request<any>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateTransaction(id: string, data: any) {
    return this.request<any>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteTransaction(id: string) {
    return this.request<any>(`/transactions/${id}`, {
      method: "DELETE",
    })
  }

  async getTransactionStats(filters?: any) {
    return this.request<any>("/transactions/stats", {
      method: "GET",
      ...(filters && { body: JSON.stringify(filters) }),
    })
  }

  async getCategoryBreakdown(filters?: any) {
    return this.request<any>("/transactions/category-breakdown", {
      method: "GET",
      ...(filters && { body: JSON.stringify(filters) }),
    })
  }

  async searchTransactions(searchParams: any) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    return this.request<any[]>(`/transactions/search?${params.toString()}`)
  }

  // Budgets API
  async getBudgets(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    return this.request<any[]>(`/budgets?${params.toString()}`)
  }

  async getBudgetById(id: string) {
    return this.request<any>(`/budgets/${id}`)
  }

  async createBudget(data: any) {
    return this.request<any>("/budgets", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateBudget(id: string, data: any) {
    return this.request<any>(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteBudget(id: string) {
    return this.request<any>(`/budgets/${id}`, {
      method: "DELETE",
    })
  }

  async getBudgetProgress(id: string) {
    return this.request<any>(`/budgets/${id}/progress`)
  }

  async getBudgetAlerts(id: string) {
    return this.request<any[]>(`/budgets/${id}/alerts`)
  }

  async getBudgetRecommendations() {
    return this.request<any[]>("/budgets/recommendations")
  }

  async getBudgetAnalytics() {
    return this.request<any>("/budgets/analytics")
  }

  // Analytics API
  async getDashboardAnalytics(householdId: string, filters: any) {
    return this.request<any>(`/analytics/${householdId}/dashboard`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getSpendingAnalytics(householdId: string, filters: any) {
    return this.request<any>(`/analytics/${householdId}/spending`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getCashflowAnalysis(householdId: string, filters: any) {
    return this.request<any>(`/analytics/${householdId}/cashflow`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getNetWorthAnalysis(householdId: string, filters: any) {
    return this.request<any>(`/analytics/${householdId}/net-worth`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getCategoryAnalytics(householdId: string, filters: any) {
    return this.request<any[]>(`/analytics/${householdId}/categories`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async getTrendAnalysis(householdId: string, filters: any) {
    return this.request<any>(`/analytics/${householdId}/trends`, {
      method: "POST",
      body: JSON.stringify(filters),
    })
  }

  async generateReport(householdId: string, reportData: any) {
    return this.request<any>(`/analytics/${householdId}/reports/generate`, {
      method: "POST",
      body: JSON.stringify(reportData),
    })
  }

  async getPerformanceMetrics(householdId: string) {
    return this.request<any>(`/analytics/${householdId}/performance`)
  }

  // Health check
  async healthCheck() {
    return this.request<any>("/health")
  }
}

export const apiClient = new ApiClient()
export default apiClient
