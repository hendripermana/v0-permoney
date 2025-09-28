"use client"

import { UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          {/* Icon retained for visual consistency */}
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 10-16 0"></path>
            <path d="M12 11a4 4 0 100-8 4 4 0 000 8z"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Your account is powered by Clerk. Changes here are synced with your Clerk user.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-background p-2">
        <UserProfile
          appearance={{
            variables: {
              colorPrimary: "#16a34a",
              borderRadius: "0.5rem",
              fontFamily: "inherit",
            },
            elements: {
              card: "bg-background border shadow-sm",
              formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              formFieldInput: "bg-background border-input text-foreground focus:border-green-500 focus:ring-green-500",
              footerActionLink: "text-green-600 hover:text-green-700",
            },
          }}
          routing="hash"
        />
      </div>
    </div>
  )
}
