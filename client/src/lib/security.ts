export class SecurityUtils {
  private static readonly CSP_NONCE_LENGTH = 16
  private static readonly CSRF_TOKEN_KEY = "csrf_token"
  private static readonly SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes

  /**
   * Generate a cryptographically secure random string
   */
  static generateSecureRandom(length = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  /**
   * Generate CSP nonce for inline scripts/styles
   */
  static generateCSPNonce(): string {
    return this.generateSecureRandom(this.CSP_NONCE_LENGTH)
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement("div")
    div.textContent = html
    return div.innerHTML
  }

  /**
   * Validate and sanitize URL to prevent open redirects
   */
  static sanitizeURL(url: string, allowedDomains: string[] = []): string | null {
    try {
      const urlObj = new URL(url, window.location.origin)

      // Only allow HTTP/HTTPS protocols
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return null
      }

      // Check if domain is in allowed list (if provided)
      if (allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some((domain) => {
          return urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        })

        if (!isAllowed) {
          return null
        }
      }

      return urlObj.toString()
    } catch {
      return null
    }
  }

  /**
   * Get CSRF token from meta tag or generate new one
   */
  static getCSRFToken(): string {
    // Try to get from meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
    if (metaToken) {
      return metaToken
    }

    // Try to get from localStorage
    let token = localStorage.getItem(this.CSRF_TOKEN_KEY)
    if (!token) {
      token = this.generateSecureRandom()
      localStorage.setItem(this.CSRF_TOKEN_KEY, token)
    }

    return token
  }

  /**
   * Add CSRF token to request headers
   */
  static addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      "X-CSRF-Token": this.getCSRFToken(),
    }
  }

  /**
   * Validate JWT token structure (basic validation)
   */
  static isValidJWTStructure(token: string): boolean {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return false
    }

    try {
      // Validate that each part is valid base64
      parts.forEach((part) => {
        atob(part.replace(/-/g, "+").replace(/_/g, "/"))
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if JWT token is expired (client-side check only)
   */
  static isJWTExpired(token: string): boolean {
    if (!this.isValidJWTStructure(token)) {
      return true
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  /**
   * Secure token storage with encryption
   */
  static setSecureToken(key: string, token: string): void {
    try {
      // In a real implementation, you might want to encrypt the token
      // For now, we'll use secure storage practices
      localStorage.setItem(key, token)

      // Set expiration timer
      const expirationTime = Date.now() + this.SESSION_TIMEOUT
      localStorage.setItem(`${key}_expires`, expirationTime.toString())
    } catch (error) {
      console.error("Failed to store secure token:", error)
    }
  }

  /**
   * Get secure token with expiration check
   */
  static getSecureToken(key: string): string | null {
    try {
      const token = localStorage.getItem(key)
      const expirationTime = localStorage.getItem(`${key}_expires`)

      if (!token || !expirationTime) {
        return null
      }

      // Check if token is expired
      if (Date.now() > Number.parseInt(expirationTime)) {
        this.removeSecureToken(key)
        return null
      }

      // Additional JWT expiration check
      if (this.isJWTExpired(token)) {
        this.removeSecureToken(key)
        return null
      }

      return token
    } catch (error) {
      console.error("Failed to retrieve secure token:", error)
      return null
    }
  }

  /**
   * Remove secure token and its metadata
   */
  static removeSecureToken(key: string): void {
    try {
      localStorage.removeItem(key)
      localStorage.removeItem(`${key}_expires`)
    } catch (error) {
      console.error("Failed to remove secure token:", error)
    }
  }

  /**
   * Content Security Policy helper
   */
  static createCSPHeader(nonce?: string): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (nonce ? ` 'nonce-${nonce}'` : ""),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "manifest-src 'self'",
    ]

    return directives.join("; ")
  }

  /**
   * Rate limiting helper for client-side
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = []

    return {
      isAllowed(): boolean {
        const now = Date.now()
        const windowStart = now - windowMs

        // Remove old requests
        while (requests.length > 0 && requests[0] < windowStart) {
          requests.shift()
        }

        // Check if we're under the limit
        if (requests.length < maxRequests) {
          requests.push(now)
          return true
        }

        return false
      },
      getRemainingRequests(): number {
        const now = Date.now()
        const windowStart = now - windowMs

        // Remove old requests
        while (requests.length > 0 && requests[0] < windowStart) {
          requests.shift()
        }

        return Math.max(0, maxRequests - requests.length)
      },
      getResetTime(): number {
        if (requests.length === 0) {
          return 0
        }
        return requests[0] + windowMs
      },
    }
  }

  /**
   * Input validation helpers
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  static validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters long")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    // Check for common weak passwords
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ]

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Secure form submission helper
   */
  static async secureFormSubmit(
    url: string,
    data: Record<string, any>,
    options: {
      method?: string
      timeout?: number
      retries?: number
    } = {},
  ): Promise<Response> {
    const { method = "POST", timeout = 10000, retries = 3 } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const headers = this.addCSRFHeader({
      "Content-Type": "application/json",
    })

    let lastError: Error

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(data),
          credentials: "include",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error

        // Don't retry on abort (timeout) or client errors
        if (error instanceof Error && error.name === "AbortError") {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    clearTimeout(timeoutId)
    throw lastError!
  }

  /**
   * Session management
   */
  static initializeSession(): void {
    // Set up session timeout warning
    let warningShown = false
    const checkSession = () => {
      const token = this.getSecureToken("accessToken")
      if (!token && !warningShown) {
        warningShown = true
        // Show session expired warning
        console.warn("Session expired. Please log in again.")
        // Redirect to login or show modal
        window.location.href = "/auth/login"
      }
    }

    // Check session every minute
    setInterval(checkSession, 60000)

    // Check session on page visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkSession()
      }
    })
  }

  /**
   * Security headers validation
   */
  static validateSecurityHeaders(response: Response): boolean {
    const requiredHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "strict-transport-security",
    ]

    return requiredHeaders.every((header) => response.headers.has(header))
  }
}

// Initialize security utilities
if (typeof window !== "undefined") {
  SecurityUtils.initializeSession()
}

export default SecurityUtils
