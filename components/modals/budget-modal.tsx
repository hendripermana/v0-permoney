"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BudgetForm } from "@/components/forms/budget-form"

interface BudgetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: any
  onSuccess?: () => void
}

export function BudgetModal({ open, onOpenChange, budget, onSuccess }: BudgetModalProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
        </DialogHeader>
        <BudgetForm budget={budget} onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  )
}
