"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Update household preferences, manage integrations, and control privacy settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            All existing settings components will live here once the new routing structure is in place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            For now, continue using the dashboard shortcuts to reach account and transaction configuration panels.
          </p>
          <Separator />
          <p>
            This placeholder keeps the navigation intact while we prepare the dedicated settings modules.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
