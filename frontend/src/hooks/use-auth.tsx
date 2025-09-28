"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs"


interface User {
  id: string
  clerkId?: string
  email: string
  name: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  households?: Array<{
    id: string
    name: string
    role: string
    permissions: string[]
  }>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  error: string | null
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const { signOut: clerkSignOut, getToken } = useClerkAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clerkLoaded) {
      setLoading(true)
      return
    }

    if (isSignedIn && clerkUser) {
      setUser({
        id: clerkUser.id,
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: clerkUser.fullName ?? (clerkUser.username ?? ""),
        avatarUrl: clerkUser.imageUrl ?? undefined,
        isActive: true,
        emailVerified: (clerkUser.emailAddresses?.some(e => e.verification?.status === "verified")) ?? false,
      })
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [isSignedIn, clerkUser, clerkLoaded])

  const retryAuth = async () => {
    setError(null)
  }

  
  const signOut = async () => {
    await clerkSignOut()
    setUser(null)
  }

  
  
  const value: AuthContextType = {
    user,
    loading,
    isSignedIn,
    signOut,
    error,
    retryAuth,
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
