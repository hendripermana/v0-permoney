"use client"

import { UserProfile } from "@clerk/nextjs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and preferences. Powered by Clerk.</p>
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
