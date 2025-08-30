"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add New Account"}</DialogTitle>
        </DialogHeader>
        <AccountForm account={account} onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  )
}