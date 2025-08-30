"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  email: string
  name: string
  isActive: boolean
  households?: Array<{
    id: string
    name: string
    role: string
    permissions: string[]
  }>
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setLoading(false)
        return
      }

      apiClient.setToken(token)
      const response = await apiClient.request<{ user: User }>("/auth/me")
      setUser(response.user)
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      apiClient.clearToken()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.request<{
        user: User
        tokens: AuthTokens
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      const { user, tokens } = response

      // Store tokens
      localStorage.setItem("auth_token", tokens.accessToken)
      localStorage.setItem("refresh_token", tokens.refreshToken)

      // Set API client token
      apiClient.setToken(tokens.accessToken)

      // Update user state
      setUser(user)

      // Setup token refresh
      setupTokenRefresh(tokens.expiresIn)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.request<{
        user: User
        tokens: AuthTokens
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      })

      const { user, tokens } = response

      // Store tokens
      localStorage.setItem("auth_token", tokens.accessToken)
      localStorage.setItem("refresh_token", tokens.refreshToken)

      // Set API client token
      apiClient.setToken(tokens.accessToken)

      // Update user state
      setUser(user)

      // Setup token refresh
      setupTokenRefresh(tokens.expiresIn)
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        await apiClient.request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      apiClient.clearToken()
      setUser(null)
    }
  }

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token")
      if (!refreshTokenValue) {
        throw new Error("No refresh token available")
      }

      const response = await apiClient.request<{
        tokens: AuthTokens
      }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      })

      const { tokens } = response

      // Update stored tokens
      localStorage.setItem("auth_token", tokens.accessToken)
      localStorage.setItem("refresh_token", tokens.refreshToken)

      // Update API client token
      apiClient.setToken(tokens.accessToken)

      // Setup next refresh
      setupTokenRefresh(tokens.expiresIn)
    } catch (error) {
      console.error("Token refresh failed:", error)
      // If refresh fails, logout user
      await logout()
      throw error
    }
  }

  const setupTokenRefresh = (expiresIn: number) => {
    // Refresh token 1 minute before expiry
    const refreshTime = (expiresIn - 60) * 1000

    setTimeout(() => {
      refreshToken().catch(console.error)
    }, refreshTime)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
