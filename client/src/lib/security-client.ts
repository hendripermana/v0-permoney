// Client-side security utilities
export class SecurityClient {
  private static instance: SecurityClient
  private csrfToken: string | null = null
  private sessionId: string | null = null

  private constructor() {
    this.initializeSecurity()
  }

  public static getInstance(): SecurityClient {
    if (!SecurityClient.instance) {
      SecurityClient.instance = new SecurityClient()
    }
    return SecurityClient.instance
  }

  private initializeSecurity(): void {
    // Initialize CSRF protection
    this.initializeCSRF()

    // Set up secure headers for all requests
    this.setupSecureHeaders()

    // Initialize content security policy reporting
    this.initializeCSPReporting()

    // Set up session management
    this.initializeSessionManagement()
  }

  private initializeCSRF(): void {
    // Get CSRF token from meta tag or cookie
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
    const cookieToken = this.getCookie("XSRF-TOKEN")

    this.csrfToken = metaToken || cookieToken

    if (!this.csrfToken) {
      console.warn("CSRF token not found. Some requests may fail.")
    }
  }

  private setupSecureHeaders(): void {
    // Override fetch to include security headers
    const originalFetch = window.fetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers)

      // Add CSRF token
      if (this.csrfToken) {
        headers.set("X-CSRF-Token", this.csrfToken)
      }

      // Add request ID for tracking
      headers.set("X-Request-ID", this.generateRequestId())

      // Add security headers
      headers.set("X-Requested-With", "XMLHttpRequest")

      const secureInit: RequestInit = {
        ...init,
        headers,
        credentials: "include", // Include cookies for authentication
      }

      try {
        const response = await originalFetch(input, secureInit)

        // Handle security-related responses
        if (response.status === 419) {
          // CSRF token mismatch - refresh token
          await this.refreshCSRFToken()
          throw new Error("CSRF token expired. Please retry your request.")
        }

        return response
      } catch (error) {
        console.error("Secure fetch error:", error)
        throw error
      }
    }
  }

  private initializeCSPReporting(): void {
    // Listen for CSP violations
    document.addEventListener("securitypolicyviolation", (event) => {
      const violation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Report CSP violation to backend
      this.reportSecurityViolation("csp-violation", violation)
    })
  }

  private initializeSessionManagement(): void {
    // Monitor session activity
    let lastActivity = Date.now()
    const sessionTimeout = 30 * 60 * 1000 // 30 minutes

    const updateActivity = () => {
      lastActivity = Date.now()
    }

    // Track user activity
    ;["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"].forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    // Check session timeout
    setInterval(() => {
      if (Date.now() - lastActivity > sessionTimeout) {
        this.handleSessionTimeout()
      }
    }, 60000) // Check every minute

    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.validateSession()
      }
    })
  }

  private async refreshCSRFToken(): Promise<void> {
    try {
      const response = await fetch("/api/v1/auth/csrf-token", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        this.csrfToken = data.token

        // Update meta tag if it exists
        const metaTag = document.querySelector('meta[name="csrf-token"]')
        if (metaTag) {
          metaTag.setAttribute("content", this.csrfToken)
        }
      }
    } catch (error) {
      console.error("Failed to refresh CSRF token:", error)
    }
  }

  private async validateSession(): Promise<boolean> {
    try {
      const response = await fetch("/api/v1/auth/validate-session", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        this.handleSessionTimeout()
        return false
      }

      return true
    } catch (error) {
      console.error("Session validation failed:", error)
      return false
    }
  }

  private handleSessionTimeout(): void {
    // Clear sensitive data
    this.clearSensitiveData()

    // Redirect to login
    window.location.href = "/login?reason=session-timeout"
  }

  private clearSensitiveData(): void {
    // Clear localStorage
    const sensitiveKeys = ["auth-token", "user-data", "financial-data"]
    sensitiveKeys.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // Clear session data
    this.csrfToken = null
    this.sessionId = null
  }

  private async reportSecurityViolation(type: string, details: any): Promise<void> {
    try {
      await fetch("/api/v1/security/report-violation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type,
          details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      })
    } catch (error) {
      console.error("Failed to report security violation:", error)
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null
    }
    return null
  }

  // Public methods for components to use
  public getCSRFToken(): string | null {
    return this.csrfToken
  }

  public async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        "X-CSRF-Token": this.csrfToken || "",
        "X-Request-ID": this.generateRequestId(),
      },
    })
  }

  public sanitizeInput(input: string): string {
    // Basic XSS prevention
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim()
  }

  public validateFinancialAmount(amount: string): boolean {
    // Validate financial amounts
    const regex = /^\d+(\.\d{1,2})?$/
    return regex.test(amount) && Number.parseFloat(amount) >= 0
  }
}

// Initialize security client
export const securityClient = SecurityClient.getInstance()

// Export utility functions
export const sanitizeInput = (input: string) => securityClient.sanitizeInput(input)
export const validateFinancialAmount = (amount: string) => securityClient.validateFinancialAmount(amount)
export const secureRequest = (url: string, options?: RequestInit) => securityClient.secureRequest(url, options)
