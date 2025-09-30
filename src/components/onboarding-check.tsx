"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface OnboardingCheckProps {
  children: React.ReactNode
}

export function OnboardingCheck({ children }: OnboardingCheckProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reconciliationAttempted = useRef(false)

  useEffect(() => {
    reconciliationAttempted.current = false
  }, [user?.id])

  const updateClerkMetadata = useCallback(
    async (primaryHouseholdId: string) => {
      if (!user) return

      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingComplete: true,
            primaryHouseholdId,
          },
        })
        await user.reload()
      } catch (metadataError) {
        console.error("Failed to sync Clerk metadata:", metadataError)
      }
    },
    [user],
  )

  const reconcileHouseholdMembership = useCallback(
    async (): Promise<boolean> => {
      if (!user || reconciliationAttempted.current) {
        return false
      }

      reconciliationAttempted.current = true

      try {
        const households = await apiClient.getHouseholds()
        if (households && households.length > 0) {
          const primaryHouseholdId = households[0].id
          await updateClerkMetadata(primaryHouseholdId)
          return true
        }
      } catch (reconciliationError) {
        console.error("Failed to reconcile household membership:", reconciliationError)
      }

      return false
    },
    [updateClerkMetadata, user],
  )

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) return

    setError(null)

    try {
      const metadata = user.unsafeMetadata ?? {}
      const hasCompletedOnboarding = metadata.onboardingComplete === true
      const primaryHouseholdId =
        typeof metadata.primaryHouseholdId === "string" && metadata.primaryHouseholdId.trim().length > 0
          ? metadata.primaryHouseholdId
          : null

      if (!hasCompletedOnboarding || !primaryHouseholdId) {
        const reconciled = await reconcileHouseholdMembership()

        if (reconciled) {
          setIsChecking(false)
          return
        }

        if (pathname !== "/onboarding") {
          setIsChecking(true)
          router.replace("/onboarding")
        }
        return
      }

      setIsChecking(false)
    } catch (error) {
      console.error("Error checking onboarding status:", error)
      setError("Failed to verify account setup. Please try refreshing the page.")
      toast({
        title: "Setup Check Failed",
        description: "Unable to verify your account setup. Please try again.",
        variant: "destructive",
      })
      setIsChecking(false)
    }
  }, [pathname, reconcileHouseholdMembership, router, user])

  useEffect(() => {
    if (isLoaded && user) {
      checkOnboardingStatus()
    }
  }, [checkOnboardingStatus, isLoaded, user])

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="text-lg font-medium">Loading Permoney...</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Setting up your secure financial management environment
          </p>
        </div>
      </div>
    )
  }

  // Show loading while checking onboarding status
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="text-lg font-medium">Checking account setup...</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            Verifying your profile and preferences
          </p>
        </div>
      </div>
    )
  }

  // Show error state if onboarding check failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-md mx-auto text-center space-y-6 p-6">
          <div className="p-6 bg-white border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="h-8 w-8" />
              <span className="font-semibold text-lg">Setup Check Failed</span>
            </div>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Loader2 className="h-4 w-4" />
                <span>Retry Setup Check</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
