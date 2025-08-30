"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { AccountForm } from "@/components/forms/account-form"

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: any
  onSuccess?: () => void
}

export function AccountModal({ open, onOpenChange, account, onSuccess }: AccountModalProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto transition-all">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add New Account"}</DialogTitle>
        </DialogHeader>

        {/* Lazy-load advanced panels to keep initial payload small */}
        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="islamic">Islamic</TabsTrigger>
            <TabsTrigger value="ocr">OCR</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <AccountForm account={account} onSuccess={handleSuccess} onCancel={handleCancel} />
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <LazyAIInsightsPanel />
          </TabsContent>

          <TabsContent value="islamic" className="mt-4 space-y-4">
            <LazyShariaCompliancePanel accountId={account?.id} />
            <LazyZakatQuickCalculator />
          </TabsContent>

          <TabsContent value="ocr" className="mt-4">
            <LazyReceiptOcrUpload />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Dynamic imports for code splitting
const LazyAIInsightsPanel = dynamic(() => import("@/components/insights/ai-insights-panel"), {
  ssr: false,
  loading: () => <div className="mt-2"><div className="h-24 animate-pulse rounded-md bg-muted" /></div>,
})

const LazyShariaCompliancePanel = dynamic(() => import("@/components/islamic/sharia-compliance-panel"), {
  ssr: false,
  loading: () => <div className="mt-2"><div className="h-24 animate-pulse rounded-md bg-muted" /></div>,
})

const LazyZakatQuickCalculator = dynamic(() => import("@/components/islamic/zakat-quick-calculator"), {
  ssr: false,
  loading: () => <div className="mt-2"><div className="h-24 animate-pulse rounded-md bg-muted" /></div>,
})

const LazyReceiptOcrUpload = dynamic(() => import("@/components/ocr/receipt-ocr-upload"), {
  ssr: false,
  loading: () => <div className="mt-2"><div className="h-24 animate-pulse rounded-md bg-muted" /></div>,
})
