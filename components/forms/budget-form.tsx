"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Target, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface BudgetFormProps {
  budget?: any
  onSuccess?: () => void
  onCancel?: () => void
}

interface BudgetCategory {
  categoryId: string
  categoryName: string
  allocatedAmount: string
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories] = useState([
    { id: "food", name: "Food & Dining" },
    { id: "transport", name: "Transportation" },
    { id: "utilities", name: "Utilities" },
    { id: "entertainment", name: "Entertainment" },
    { id: "healthcare", name: "Healthcare" },
    { id: "shopping", name: "Shopping" },
    { id: "education", name: "Education" },
    { id: "investment", name: "Investment" },
  ])

  const [formData, setFormData] = useState({
    name: budget?.name || "",
    period: budget?.period || "MONTHLY",
    startDate: budget?.startDate
      ? new Date(budget.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    endDate: budget?.endDate ? new Date(budget.endDate).toISOString().split("T")[0] : "",
    currency: budget?.currency || "IDR",
  })

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    budget?.categories?.map((cat: any) => ({
      categoryId: cat.categoryId,
      categoryName: categories.find((c) => c.id === cat.categoryId)?.name || "Unknown",
      allocatedAmount: (cat.allocatedAmountCents / 100).toString(),
    })) || [
      { categoryId: "food", categoryName: "Food & Dining", allocatedAmount: "" },
      { categoryId: "transport", categoryName: "Transportation", allocatedAmount: "" },
    ],
  )

  useEffect(() => {
    // Auto-calculate end date based on period
    if (formData.startDate && formData.period) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(startDate)

      switch (formData.period) {
        case "WEEKLY":
          endDate.setDate(startDate.getDate() + 6)
          break
        case "MONTHLY":
          endDate.setMonth(startDate.getMonth() + 1)
          endDate.setDate(startDate.getDate() - 1)
          break
        case "QUARTERLY":
          endDate.setMonth(startDate.getMonth() + 3)
          endDate.setDate(startDate.getDate() - 1)
          break
        case "YEARLY":
          endDate.setFullYear(startDate.getFullYear() + 1)
          endDate.setDate(startDate.getDate() - 1)
          break
      }

      setFormData((prev) => ({
        ...prev,
        endDate: endDate.toISOString().split("T")[0],
      }))
    }
  }, [formData.startDate, formData.period])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const validCategories = budgetCategories.filter(
        (cat) => cat.categoryId && cat.allocatedAmount && Number.parseFloat(cat.allocatedAmount) > 0,
      )

      if (validCategories.length === 0) {
        throw new Error("Please add at least one budget category with an amount")
      }

      const budgetData = {
        name: formData.name,
        period: formData.period,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        currency: formData.currency,
        categories: validCategories.map((cat) => ({
          categoryId: cat.categoryId,
          allocatedAmountCents: Math.round(Number.parseFloat(cat.allocatedAmount) * 100),
        })),
      }

      if (budget) {
        await apiClient.updateBudget(budget.id, budgetData)
      } else {
        await apiClient.createBudget(budgetData)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addCategory = () => {
    setBudgetCategories((prev) => [...prev, { categoryId: "", categoryName: "", allocatedAmount: "" }])
  }

  const removeCategory = (index: number) => {
    setBudgetCategories((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCategory = (index: number, field: keyof BudgetCategory, value: string) => {
    setBudgetCategories((prev) =>
      prev.map((cat, i) => {
        if (i === index) {
          if (field === "categoryId") {
            const categoryName = categories.find((c) => c.id === value)?.name || ""
            return { ...cat, [field]: value, categoryName }
          }
          return { ...cat, [field]: value }
        }
        return cat
      }),
    )
  }

  const totalBudget = budgetCategories.reduce((sum, cat) => {
    const amount = Number.parseFloat(cat.allocatedAmount) || 0
    return sum + amount
  }, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          {budget ? "Edit Budget" : "Create New Budget"}
        </CardTitle>
        <CardDescription>
          {budget ? "Update your budget details and allocations" : "Set up a new budget to track your spending"}
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
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Budget 2024"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={formData.period} onValueChange={(value) => handleInputChange("period", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Budget Categories</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCategory} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>

            <div className="space-y-3">
              {budgetCategories.map((category, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={category.categoryId}
                        onValueChange={(value) => updateCategory(index, "categoryId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Allocated Amount (IDR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={category.allocatedAmount}
                        onChange={(e) => updateCategory(index, "allocatedAmount", e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {budgetCategories.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCategory(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalBudget > 0 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-semibold">Total Budget:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {formatCurrency(totalBudget)}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {budget ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  {budget ? "Update Budget" : "Create Budget"}
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
