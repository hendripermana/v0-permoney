"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Lightbulb, Sparkles, Calendar } from "lucide-react"

interface AIInsightsPanelProps {
  householdId?: string
}

type Insight = {
  id: string
  type: string
  title: string
  description: string
  data?: string
  actionable?: boolean
  priority?: string
  createdAt?: string
  validUntil?: string
  isDismissed?: boolean
}

const priorityStyles: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export default function AIInsightsPanel({ householdId }: AIInsightsPanelProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [generating, setGenerating] = useState<boolean>(false)

  const resolvedHouseholdId = useMemo(() => {
    return (
      householdId || user?.households?.[0]?.id || localStorage.getItem("household_id") || ""
    )
  }, [householdId, user])

  useEffect(() => {
    if (!resolvedHouseholdId) return
    fetchInsights()
  }, [resolvedHouseholdId])

  async function fetchInsights() {
    try {
      setLoading(true)
      const data = await apiClient.getAIInsights(resolvedHouseholdId)
      setInsights(data || [])
    } catch (error) {
      console.error("Failed to load AI insights:", error)
      toast({
        title: "AI Insights",
        description: "Unable to fetch insights at the moment.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDismiss(id: string) {
    try {
      await apiClient.dismissAIInsight(id)
      setInsights((prev) => prev.filter((i) => i.id !== id))
    } catch (error) {
      toast({ title: "Action failed", description: "Could not dismiss insight.", variant: "destructive" })
    }
  }

  async function handleGenerateReport() {
    if (!resolvedHouseholdId) return
    try {
      setGenerating(true)
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      await apiClient.generateAIMonthlyReport(resolvedHouseholdId, year, month, {})
      toast({ title: "Monthly report", description: "AI monthly report generated." })
      await fetchInsights()
    } catch (error) {
      toast({ title: "Generation failed", description: "Could not generate report.", variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" /> AI Insights
        </CardTitle>
        <CardDescription>Personalized, actionable insights from your recent activity.</CardDescription>
      </CardHeader>
      <CardContent>
        {!resolvedHouseholdId && (
          <div className="text-sm text-muted-foreground">No household selected. Sign in or provide a household ID.</div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ) : insights.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border p-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <div className="text-sm">No insights yet. Generate a monthly summary to get started.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="group rounded-md border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-2">
                  <Badge
                    className={priorityStyles[insight.priority || "MEDIUM"] || priorityStyles.MEDIUM}
                  >
                    {insight.priority || "MEDIUM"}
                  </Badge>
                  <div className="ml-1 flex-1">
                    <div className="font-medium leading-6">{insight.title}</div>
                    <div className="text-sm text-muted-foreground">{insight.description}</div>
                    {insight.validUntil && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Valid until {new Date(insight.validUntil).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDismiss(insight.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleGenerateReport} disabled={!resolvedHouseholdId || generating}>
            {generating ? "Generating..." : "Generate Monthly Report"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

