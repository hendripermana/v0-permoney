"use client"

import { useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { Calculator, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ZakatQuickCalculatorProps {
  householdId?: string
}

export default function ZakatQuickCalculator({ householdId }: ZakatQuickCalculatorProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [date, setDate] = useState<string>("")

  const resolvedHouseholdId = useMemo(() => {
    return (
      householdId || user?.households?.[0]?.id || localStorage.getItem("household_id") || ""
    )
  }, [householdId, user])

  async function calculate() {
    if (!resolvedHouseholdId) {
      toast({ title: "Missing household", description: "Select a household first.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const res = await apiClient.calculateZakat({ householdId: resolvedHouseholdId, calculationDate: date || undefined })
      setResult(res)
    } catch (e) {
      toast({ title: "Calculation failed", description: "Unable to calculate zakat.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount)
    } catch {
      return `${currency} ${amount?.toLocaleString()}`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-green-600" /> Zakat (Quick)</CardTitle>
        <CardDescription>One-click zakat calculation using your latest balances.</CardDescription>
      </CardHeader>
      <CardContent>
        {!resolvedHouseholdId ? (
          <div className="text-sm text-muted-foreground">No household selected.</div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="sm:max-w-xs"
                placeholder="Calculation date (optional)"
              />
              <Button onClick={calculate} className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Calculate
              </Button>
            </div>

            {result && (
              <div className="rounded-md border p-3 text-sm">
                <div className="mb-1 font-medium">Summary</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    Nisab: {formatCurrency(result?.nisabThreshold?.amount, result?.nisabThreshold?.currency)}
                  </div>
                  <div>
                    Zakatable: {formatCurrency(result?.totalZakatableAssets?.amount, result?.totalZakatableAssets?.currency)}
                  </div>
                  <div>
                    Due: {formatCurrency(result?.zakatAmount?.amount, result?.zakatAmount?.currency)}
                  </div>
                  <div>
                    Status: {result?.isZakatDue ? "Zakat Due" : "Not Due"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

