import {
  API_BASE_URL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  STORAGE_KEYS,
  isBrowser,
} from "./config"
import type {
  AvailablePermissionsResponse,
  CreateHouseholdData,
  FilteredViewData,
  Household,
  HouseholdMember,
  HouseholdRoleResponse,
  HouseholdSettings,
  InviteMemberData,
  PermissionCheckResponse,
  UpdateMemberData,
  ViewType,
} from "@/types/household"

export class ApiClientError extends Error {
  code?: string
  status?: number
  details?: unknown

  constructor(message: string, options: { code?: string; status?: number; details?: unknown } = {}) {
    super(message)
    this.name = "ApiClientError"
    this.code = options.code
    this.status = options.status
    this.details = options.details
  }
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

const JSON_CONTENT_TYPE = "application/json"
const API_PATH_PREFIX = "/api"

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")
const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`)

const normalizeBaseUrl = (rawBaseUrl?: string) => {
  if (!rawBaseUrl) {
    return API_PATH_PREFIX
  }

  const trimmed = stripTrailingSlash(rawBaseUrl.trim())
  if (!trimmed) {
    return API_PATH_PREFIX
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (!url.pathname || url.pathname === "/") {
        url.pathname = API_PATH_PREFIX
      }
      return stripTrailingSlash(url.toString())
    } catch {
      return API_PATH_PREFIX
    }
  }

  const normalizedPath = stripTrailingSlash(ensureLeadingSlash(trimmed))
  if (normalizedPath === "/") {
    return API_PATH_PREFIX
  }

  return normalizedPath
}

const buildQueryString = (params?: Record<string, unknown>) => {
  if (!params) {
    return ""
  }

  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null) return
        searchParams.append(key, String(item))
      })
      return
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString())
      return
    }

    searchParams.append(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

class ApiClient {
  private baseURL: string
  private token: string | null = null
  private retryAttempts = 3
  private retryDelay = 1000
  private requestTimeout = DEFAULT_REQUEST_TIMEOUT_MS

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = normalizeBaseUrl(baseURL)
    // Do not read or persist any custom auth token; Clerk is the single source of auth
    this.token = null
  }

  public setBaseURL(baseURL: string) {
    this.baseURL = normalizeBaseUrl(baseURL)
  }

  public getBaseURL() {
    return this.baseURL
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint)

    // Resolve Clerk token on demand (client-side)
    let authToken: string | null = null
    try {
      // Prefer ClerkJS if available in browser
      if (isBrowser && (window as any)?.Clerk?.session?.getToken) {
        const session = (window as any).Clerk.session
        try {
          authToken = await session.getToken({ template: "integration_fallback" })
        } catch (templateError) {
          authToken = await session.getToken()
        }
      }
    } catch (_) {
      // Swallow token resolution errors; request will proceed without Authorization
    }

    // Build headers conditionally to support multipart uploads (FormData)
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
    const baseHeaders: Record<string, string> = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }

    const config: RequestInit = {
      cache: 'no-store',
      credentials: 'include',
      ...options,
      headers: {
        ...baseHeaders,
        ...(!isFormData ? { "Content-Type": JSON_CONTENT_TYPE } : {}),
        ...(options.headers as any),
      },
    }

    return this.requestWithRetry(url, config)
  }

  private buildUrl(endpoint: string): string {
    if (/^https?:/i.test(endpoint)) {
      return endpoint
    }

    return `${this.baseURL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
  }

  private async requestWithRetry<T>(url: string, config: RequestInit, attempt: number = 1): Promise<T> {
    try {
      // Check network connectivity
      if (isBrowser && !navigator.onLine) {
        throw this.createApiError("No internet connection", "NETWORK_ERROR", 0)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = this.createApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || this.getErrorCodeFromStatus(response.status),
          response.status,
          errorData
        )

        // No custom refresh token flow. Authorization must come from Clerk per request.

        throw error
      }

      if (response.status === 204) {
        return undefined as T
      }

      const contentType = response.headers.get("content-type") ?? ""

      if (!contentType.toLowerCase().includes("json")) {
        return undefined as T
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

  private createApiError(message: string, code?: string, status?: number, details?: unknown) {
    return new ApiClientError(message, { code, status, details })
  }

  private isApiError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError
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

  // Authentication methods (kept for backward compatibility; no-ops)
  setToken(_token: string) {
    // No-op: Clerk provides tokens on demand; do not persist custom tokens
    this.token = null
  }

  clearToken() {
    // No-op: nothing to clear; Clerk manages its own session
    this.token = null
  }

  // Removed: no custom refresh token flow. Clerk is the single source of authentication.

  // Accounts API
  async getAccounts(arg?: string | Record<string, unknown>): Promise<any[]> {
    const query = typeof arg === "string" ? { householdId: arg } : arg
    return this.request<any[]>(`/accounts${buildQueryString(query)}`)
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
    const params: Record<string, unknown> = { currency }
    if (householdId) params.householdId = householdId
    return this.request<any>(`/accounts/net-worth${buildQueryString(params)}`)
  }

  async getAccountStats(householdId?: string) {
    return this.request<any>(`/accounts/stats${buildQueryString(householdId ? { householdId } : undefined)}`)
  }

  async getAccountsGrouped(householdId: string) {
    return this.request<any>(`/accounts/grouped${buildQueryString({ householdId })}`)
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
    const query = typeof arg1 === "string" ? { householdId: arg1, ...(arg2 ?? {}) } : arg1
    return this.request<any[]>(`/transactions${buildQueryString(query)}`)
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
    return this.request<any>(`/transactions/stats${buildQueryString(filters)}`)
  }

  async getCategoryBreakdown(filters?: any) {
    return this.request<any>(`/transactions/category-breakdown${buildQueryString(filters)}`)
  }

  async searchTransactions(searchParams: any) {
    return this.request<any[]>(`/transactions/search${buildQueryString(searchParams)}`)
  }

  // Budgets API
  async getBudgets(filters?: any) {
    return this.request<any[]>(`/budgets${buildQueryString(filters)}`)
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
  async getHouseholds(): Promise<Household[]> {
    return this.request<Household[]>("/households")
  }

  async getHousehold(id: string): Promise<Household> {
    return this.request<Household>(`/households/${id}`)
  }

  async createHousehold(data: CreateHouseholdData): Promise<Household> {
    return this.request<Household>("/households", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateHousehold(
    id: string,
    data: Partial<CreateHouseholdData> & { settings?: HouseholdSettings }
  ): Promise<Household> {
    return this.request<Household>(`/households/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteHousehold(id: string): Promise<void> {
    await this.request<void>(`/households/${id}`, {
      method: "DELETE",
    })
  }

  async getMembers(householdId: string): Promise<HouseholdMember[]> {
    return this.request<HouseholdMember[]>(`/households/${householdId}/members`)
  }

  async inviteMember(householdId: string, data: InviteMemberData) {
    return this.request<{ message: string }>(`/households/${householdId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateMember(
    householdId: string,
    memberId: string,
    data: UpdateMemberData
  ) {
    return this.request<{ message: string }>(`/households/${householdId}/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async removeMember(householdId: string, memberId: string): Promise<void> {
    await this.request<void>(`/households/${householdId}/members/${memberId}`, {
      method: "DELETE",
    })
  }

  async updateSettings(householdId: string, settings: Record<string, unknown>) {
    return this.request<HouseholdSettings>(`/households/${householdId}/settings`, {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  async getFilteredData(householdId: string, viewType: ViewType): Promise<FilteredViewData> {
    return this.request<FilteredViewData>(
      `/households/${householdId}/filtered-data${buildQueryString({ viewType })}`
    )
  }

  async checkPermission(householdId: string, permission: string): Promise<PermissionCheckResponse> {
    return this.request<PermissionCheckResponse>(
      `/households/${householdId}/permissions/${permission}`
    )
  }

  async getUserRole(householdId: string): Promise<HouseholdRoleResponse> {
    return this.request<HouseholdRoleResponse>(`/households/${householdId}/role`)
  }

  async getAvailablePermissions(): Promise<AvailablePermissionsResponse> {
    return this.request<AvailablePermissionsResponse>("/households/permissions")
  }

  async getHouseholdPermissions(householdId: string): Promise<string[]> {
    return this.request<string[]>(`/households/${householdId}/permissions`)
  }

  async getCurrentHousehold(): Promise<Household | null> {
    const households = await this.getHouseholds()
    return households?.[0] ?? null
  }
}

export const apiClient = new ApiClient()
export default apiClient
