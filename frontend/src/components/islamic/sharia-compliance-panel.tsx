"use client"

import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { ShieldCheck, ShieldAlert } from "lucide-react"

interface ShariaCompliancePanelProps {
  accountId?: string
}

const STATUSES = [
  { value: "COMPLIANT", label: "Compliant", style: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "NON_COMPLIANT", label: "Non-Compliant", style: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "UNDER_REVIEW", label: "Under Review", style: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "QUESTIONABLE", label: "Questionable", style: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
]

export default function ShariaCompliancePanel({ accountId }: ShariaCompliancePanelProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const current = useMemo(() => STATUSES.find(s => s.value === status), [status])

  useEffect(() => {
    if (!accountId) return
    load()
  }, [accountId])

  async function load() {
    try {
      setLoading(true)
      const res = await apiClient.getAccountCompliance(accountId!)
      if (res) {
        setStatus(res.complianceStatus)
        setNotes(res.complianceNotes || "")
      }
    } catch (e) {
      // soft fail
    } finally {
      setLoading(false)
    }
  }

  async function handleAutoAssess() {
    if (!accountId) return
    try {
      setLoading(true)
      const res = await apiClient.autoAssessAccountCompliance(accountId)
      setStatus(res.suggestedStatus)
      toast({ title: "Assessment complete", description: `Suggested: ${res.suggestedStatus}` })
    } catch (e) {
      toast({ title: "Assessment failed", description: "Could not auto-assess.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!accountId || !status) return
    try {
      setLoading(true)
      await apiClient.updateAccountCompliance({ accountId, complianceStatus: status, complianceNotes: notes || undefined })
      toast({ title: "Saved", description: "Compliance status saved." })
    } catch (e) {
      toast({ title: "Save failed", description: "Could not update status.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {current?.value === "COMPLIANT" ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          )}
          Sharia Compliance
        </CardTitle>
        <CardDescription>Track and manage this account’s Sharia status.</CardDescription>
      </CardHeader>
      <CardContent>
        {!accountId ? (
          <div className="text-sm text-muted-foreground">Save the account first to manage compliance.</div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Current status:</div>
              {current ? <Badge className={current.style}>{current.label}</Badge> : <Badge variant="outline">Unknown</Badge>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-sm font-medium">Update Status</div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Quick Actions</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleAutoAssess} disabled={loading}>Auto Assess</Button>
                  <Button onClick={handleSave} disabled={loading || !status}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

