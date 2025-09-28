"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useUser } from "@clerk/nextjs"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, loading, error, retryAuth } = useAuth()
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const router = useRouter()

  // Show toast notifications for errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

  useEffect(() => {
    // Wait for both Clerk and our auth to load
    if (!clerkLoaded || loading) {
      return
    }

    // If Clerk user is not signed in, redirect to login
    if (!isSignedIn) {
      router.push(redirectTo)
      return
    }

    // If our backend user is not available, wait for backend authentication
    // This should be handled by the AuthProvider
    if (!user) {
      return
    }
  }, [user, loading, clerkLoaded, isSignedIn, router, redirectTo])

  // Show loading while Clerk or our auth is loading
  if (!clerkLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // If not signed in with Clerk, don't render anything (will redirect)
  if (!isSignedIn) {
    return null
  }

  // If there's an authentication error, show error with retry option
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-md mx-auto text-center space-y-6 p-6">
          <div className="p-6 bg-white border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="h-8 w-8" />
              <span className="font-semibold text-lg">Authentication Error</span>
            </div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button
                onClick={retryAuth}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Authentication</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please try refreshing the page or contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If our backend user is not available yet, show loading with better messaging
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="text-lg font-medium">Setting up your account...</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            We're connecting your Clerk account with our system. This should only take a moment.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
