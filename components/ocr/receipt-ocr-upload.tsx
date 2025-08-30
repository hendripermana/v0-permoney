"use client"

import { useMemo, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { FileUp, Image, Wand2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface ReceiptOcrUploadProps {
  householdId?: string
  onSuggestionSelected?: (suggestion: {
    description: string
    amount: number
    date: string
    merchant?: string
    suggestedCategoryId?: string
  }) => void
}

export default function ReceiptOcrUpload({ householdId, onSuggestionSelected }: ReceiptOcrUploadProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [docId, setDocId] = useState<string>("")

  const resolvedHouseholdId = useMemo(() => {
    return (
      householdId || user?.households?.[0]?.id || localStorage.getItem("household_id") || ""
    )
  }, [householdId, user])

  async function handleUpload() {
    if (!file) {
      toast({ title: "No file", description: "Choose an image or PDF receipt first.", variant: "destructive" })
      return
    }
    if (!resolvedHouseholdId) {
      toast({ title: "No household", description: "Please select a household.", variant: "destructive" })
      return
    }
    try {
      setUploading(true)
      const uploaded = await apiClient.uploadDocument(file, { householdId: resolvedHouseholdId, documentType: "RECEIPT" })
      setDocId(uploaded.id)

      const processed = await apiClient.processDocument(uploaded.id)
      if (!processed?.id) {
        throw new Error("Processing failed")
      }
      const sugg = await apiClient.getTransactionSuggestions(uploaded.id)
      setSuggestions(sugg || [])
      toast({ title: "Receipt processed", description: `${sugg?.length || 0} suggestions found.` })
    } catch (e: any) {
      toast({ title: "OCR failed", description: e?.message || "Could not process receipt.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  function applySuggestion(s: any) {
    onSuggestionSelected?.({
      description: s.description,
      amount: s.amount,
      date: new Date(s.date).toISOString().split("T")[0],
      merchant: s.merchant,
      suggestedCategoryId: s.suggestedCategoryId,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-blue-600" /> Scan Receipt (OCR)</CardTitle>
        <CardDescription>Upload a receipt to auto-fill transaction details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleUpload} disabled={!file || uploading} className="inline-flex items-center gap-2">
            {uploading ? (
              "Processing..."
            ) : (
              <>
                <FileUp className="h-4 w-4" /> Upload & Process
              </>
            )}
          </Button>
        </div>

        {uploading && (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium">Suggestions</div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <Image className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium leading-5">{s.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleDateString()} • {s.currency} {s.amount?.toLocaleString()} {s.merchant ? `• ${s.merchant}` : ""}
                      </div>
                      {s.suggestedCategoryName && (
                        <div className="mt-1"><Badge variant="outline">{s.suggestedCategoryName}</Badge></div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => applySuggestion(s)}>Apply</Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

