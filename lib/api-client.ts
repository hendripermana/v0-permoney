const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
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
  private baseURL: string
  private token: string | null = null
  private retryAttempts: number = 3
  private retryDelay: number = 1000

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Build headers conditionally to support multipart uploads (FormData)
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
    const baseHeaders: Record<string, string> = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...baseHeaders,
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(options.headers as any),
      },
    }

    return this.requestWithRetry(url, config)
  }

  private async requestWithRetry<T>(url: string, config: RequestInit, attempt: number = 1): Promise<T> {
    try {
      // Check network connectivity
      if (typeof window !== "undefined" && !navigator.onLine) {
        throw this.createApiError("No internet connection", "NETWORK_ERROR", 0)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || this.getErrorCodeFromStatus(response.status),
          response.status,
          errorData
        )
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      // Handle abort errors
      if (error.name === "AbortError") {
        throw this.createApiError("Request timeout", "TIMEOUT_ERROR", 408)
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw this.createApiError("Network error - please check your connection", "NETWORK_ERROR", 0)
      }

      // Retry logic for certain errors
      if (this.shouldRetry(error, attempt)) {
        const delay = this.calculateRetryDelay(attempt)
        await this.sleep(delay)
        return this.requestWithRetry(url, config, attempt + 1)
      }

      // Re-throw API errors as-is
      if (this.isApiError(error)) {
        throw error
      }

      // Wrap unknown errors
      throw this.createApiError(
        error.message || "An unexpected error occurred",
        "UNKNOWN_ERROR",
        undefined,
        error
      )
    }
  }

  private createApiError(message: string, code?: string, status?: number, details?: any): ApiError {
    return {
      message,
      code,
      status,
      details,
    }
  }

  private isApiError(error: any): error is ApiError {
    return error && typeof error.message === "string" && (error.code || error.status)
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return "BAD_REQUEST"
      case 401:
        return "UNAUTHORIZED"
      case 403:
        return "FORBIDDEN"
      case 404:
        return "NOT_FOUND"
      case 409:
        return "CONFLICT"
      case 422:
        return "VALIDATION_ERROR"
      case 429:
        return "RATE_LIMIT"
      case 500:
        return "INTERNAL_ERROR"
      case 502:
        return "BAD_GATEWAY"
      case 503:
        return "SERVICE_UNAVAILABLE"
      case 504:
        return "GATEWAY_TIMEOUT"
      default:
        return "HTTP_ERROR"
    }
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.retryAttempts) {
      return false
    }

    // Retry on network errors
    if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT_ERROR") {
      return true
    }

    // Retry on server errors (5xx)
    if (error.status && error.status >= 500) {
      return true
    }

    // Retry on rate limiting
    if (error.status === 429) {
      return true
    }

    return false
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * baseDelay
    return Math.min(baseDelay + jitter, 10000) // Max 10 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
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
  async getAccounts(arg?: any): Promise<any[]> {
    // Supports both getAccounts(filters) and getAccounts(householdId: string)
    const params = new URLSearchParams()
    if (typeof arg === "string") {
      params.append("householdId", arg)
    } else if (arg && typeof arg === "object") {
      Object.entries(arg).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v))
      })
    }
    const qs = params.toString()
    return this.request<any[]>(`/accounts${qs ? `?${qs}` : ""}`)
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

  async getNetWorth(arg1?: string, arg2?: string) {
    // getNetWorth(currency?) or getNetWorth(householdId, currency?)
    let householdId: string | undefined
    let currency = "IDR"
    if (arg1 && arg1.length === 3) {
      currency = arg1
    } else if (arg1) {
      householdId = arg1
      if (arg2) currency = arg2
    }
    const params = new URLSearchParams({ currency })
    if (householdId) params.append("householdId", householdId)
    return this.request<any>(`/accounts/net-worth?${params.toString()}`)
  }

  async getAccountStats(householdId?: string) {
    const qs = householdId ? `?householdId=${householdId}` : ""
    return this.request<any>(`/accounts/stats${qs}`)
  }

  async getAccountsGrouped(householdId: string) {
    return this.request<any>(`/accounts/grouped?householdId=${householdId}`)
  }

  // -------- AI Insights API --------
  async getAIInsights(householdId: string) {
    return this.request<any[]>(`/ai-insights/${householdId}/insights`, { method: "GET" })
  }

  async generateAIMonthlyReport(householdId: string, year: number, month: number, options?: any) {
    return this.request<any>(`/ai-insights/${householdId}/monthly-report/${year}/${month}`, {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    })
  }

  async dismissAIInsight(insightId: string) {
    return this.request<void>(`/ai-insights/insights/${insightId}`, { method: "DELETE" })
  }

  // -------- Islamic Finance API --------
  async calculateZakat(data: { householdId: string; calculationDate?: string; assetTypes?: string[] }) {
    return this.request<any>("/islamic-finance/zakat/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAccountCompliance(accountId: string) {
    return this.request<any>(`/islamic-finance/compliance/accounts/${accountId}`, { method: "GET" })
  }

  async updateAccountCompliance(data: { accountId: string; complianceStatus: string; complianceNotes?: string }) {
    return this.request<any>(`/islamic-finance/compliance/accounts`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async autoAssessAccountCompliance(accountId: string) {
    return this.request<{ accountId: string; suggestedStatus: string }>(
      `/islamic-finance/compliance/accounts/${accountId}/auto-assess`,
      { method: "POST" }
    )
  }

  async getIslamicFinanceDashboard(householdId: string) {
    return this.request<any>(`/islamic-finance/dashboard/${householdId}`, { method: "GET" })
  }

  // -------- OCR & Document Processing API --------
  async uploadDocument(file: File | Blob, fields: { householdId: string; documentType: string; description?: string }) {
    const form = new FormData()
    form.append("file", file)
    form.append("householdId", fields.householdId)
    form.append("documentType", fields.documentType)
    if (fields.description) form.append("description", fields.description)

    return this.request<any>(`/ocr/upload`, {
      method: "POST",
      body: form,
    })
  }

  async processDocument(documentId: string) {
    return this.request<any>(`/ocr/process`, {
      method: "POST",
      body: JSON.stringify({ documentId }),
    })
  }

  async getTransactionSuggestions(documentId: string) {
    return this.request<any[]>(`/ocr/documents/${documentId}/suggestions`, { method: "GET" })
  }

  async approveTransactionSuggestion(suggestionId: string) {
    return this.request<any>(`/ocr/suggestions/approve`, {
      method: "POST",
      body: JSON.stringify({ suggestionId }),
    })
  }

  async getDocumentsByHousehold(householdId: string) {
    return this.request<any[]>(`/ocr/documents/${householdId}`, { method: "GET" })
  }

  async getDocumentById(documentId: string) {
    return this.request<any>(`/ocr/documents/${documentId}`, { method: "GET" })
  }

  // Transactions API
  async getTransactions(arg1?: any, arg2?: any) {
    // getTransactions(filters?) or getTransactions(householdId, params?)
    const params = new URLSearchParams()
    if (typeof arg1 === "string") {
      params.append("householdId", arg1)
      if (arg2) {
        Object.entries(arg2).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.append(k, String(v))
        })
      }
    } else if (arg1 && typeof arg1 === "object") {
      Object.entries(arg1).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v))
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
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v))
      })
    }
    return this.request<any>(`/transactions/stats?${params.toString()}`)
  }

  async getCategoryBreakdown(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v))
      })
    }
    return this.request<any>(`/transactions/category-breakdown?${params.toString()}`)
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

  // Unified convenience: used by hooks/use-dashboard.ts
  async getDashboardData(householdId: string, filters?: AnalyticsFilters) {
    const defaultFilters = filters ?? {
      startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      currency: "IDR",
      includeTransfers: false,
    }
    return this.request<any>(`/analytics/${householdId}/dashboard`, {
      method: "POST",
      body: JSON.stringify(defaultFilters),
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

  // Households
  async getHouseholds(): Promise<any[]> {
    return this.request<any[]>("/households")
  }

  async getCurrentHousehold(): Promise<any | null> {
    const households = await this.getHouseholds()
    return households?.[0] ?? null
  }
}

export const apiClient = new ApiClient()
export default apiClient
