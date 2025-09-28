"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Track goals and envelope allocations across your household.
          </p>
        </div>
        <Button className="w-full sm:w-fit">
          <PlusCircle className="mr-2 h-4 w-4" />
          New budget
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget workspace placeholder</CardTitle>
          <CardDescription>
            The existing budget analytics and forms will be embedded here after the routing cleanup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This temporary panel keeps navigation intact without removing any functionality from the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
