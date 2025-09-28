"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, PlusCircle } from "lucide-react"

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Review recent activity, filter by category, and create new entries.
          </p>
        </div>
        <Button asChild className="w-full sm:w-fit">
          <Link href="/transactions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading transactions</CardTitle>
              <CardDescription>Fetching household activity…</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20" />
              ))}
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Transactions list placeholder</CardTitle>
            <CardDescription>
              The existing transaction table &amp; filters will be mounted here in the next step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              We&apos;re keeping the routing refactor isolated from data plumbing, so this page currently renders a
              placeholder section.
            </p>
            <p>
              Use the button above to navigate to the new transaction flow once it&apos;s wired up, or head back to the
              dashboard.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Return to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
}
