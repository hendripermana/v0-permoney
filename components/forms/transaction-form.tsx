"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Plus, Minus } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface TransactionFormProps {
  transaction?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories] = useState([
    { id: "food", name: "Food & Dining" },
    { id: "transport", name: "Transportation" },
    { id: "utilities", name: "Utilities" },
    { id: "entertainment", name: "Entertainment" },
    { id: "healthcare", name: "Healthcare" },
    { id: "shopping", name: "Shopping" },
    { id: "education", name: "Education" },
    { id: "salary", name: "Salary" },
    { id: "freelance", name: "Freelance" },
    { id: "investment", name: "Investment" },
  ])

  const [formData, setFormData] = useState({
    description: transaction?.description || "",
    amount: transaction ? Math.abs(transaction.amountCents / 100).toString() : "",
    type: transaction?.amountCents > 0 ? "income" : "expense",
    categoryId: transaction?.categoryId || "",
    accountId: transaction?.accountId || "",
    date: transaction?.date
      ? new Date(transaction.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    notes: transaction?.notes || "",
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const accountsData = await apiClient.getAccounts({ isActive: true })
      setAccounts(accountsData)
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      // Fallback to mock accounts
      setAccounts([
        { id: "1", name: "BCA Checking", type: "ASSET" },
        { id: "2", name: "Mandiri Savings", type: "ASSET" },
        { id: "3", name: "Cash Wallet", type: "ASSET" },
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      const transactionData = {
        description: formData.description,
        amountCents: Math.round(amount * 100) * (formData.type === "expense" ? -1 : 1),
        categoryId: formData.categoryId,
        accountId: formData.accountId,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes || undefined,
      }

      if (transaction) {
        await apiClient.updateTransaction(transaction.id, transactionData)
      } else {
        await apiClient.createTransaction(transactionData)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {formData.type === "income" ? (
            <Plus className="h-5 w-5 text-green-600" />
          ) : (
            <Minus className="h-5 w-5 text-red-600" />
          )}
          {transaction ? "Edit Transaction" : "Add New Transaction"}
        </CardTitle>
        <CardDescription>
          {transaction ? "Update transaction details" : "Enter the details for your new transaction"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Income
                    </div>
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Expense
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (IDR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Enter transaction description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={formData.accountId} onValueChange={(value) => handleInputChange("accountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className={`flex-1 ${formData.type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {transaction ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  {formData.type === "income" ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
                  {transaction ? "Update Transaction" : "Add Transaction"}
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
