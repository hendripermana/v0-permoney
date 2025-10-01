"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Profile page redirect
 * 
 * This page redirects to /settings for a unified settings experience.
 * All profile and account settings are now consolidated in the Settings page.
 */
export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to settings page
    router.replace("/settings")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-sm text-muted-foreground">Redirecting to Settings...</p>
      </div>
    </div>
  )
}
