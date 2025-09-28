"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal account details and preferences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile settings placeholder</CardTitle>
          <CardDescription>
            We&apos;ll mount the existing profile settings components in this slot once the routing structure is finalized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This placeholder keeps your navigation intact while we focus on stabilizing URL paths.
          </p>
          <Button variant="outline">Update display name</Button>
        </CardContent>
      </Card>
    </div>
  )
}
