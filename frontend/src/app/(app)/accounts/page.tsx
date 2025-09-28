"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage every financial account connected to your household.
          </p>
        </div>
        <Button className="w-full sm:w-fit">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading accounts</CardTitle>
              <CardDescription>Preparing your account overview…</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Household Accounts</CardTitle>
            <CardDescription>
              We&apos;ll surface the detailed account list once hooked into the data layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              This is a placeholder view. The existing account components will be integrated here during the
              follow-up task so we don&apos;t lose functionality while we refactor the routing structure.
            </p>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}
