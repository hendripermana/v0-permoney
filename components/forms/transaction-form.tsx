"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Plus, Minus, CheckCircle, Calendar, DollarSign } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

// Validation schema
const transactionSchema = z.object({
  description: z.string().min(1, "Description is required").max(255, "Description too long"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Amount must be a positive number"),
  type: z.enum(["income", "expense"], {
    required_error: "Transaction type is required",
  }),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transaction?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [categories] = useState([
    { id: "food", name: "Food & Dining", icon: "🍽️" },
    { id: "transport", name: "Transportation", icon: "🚗" },
    { id: "utilities", name: "Utilities", icon: "⚡" },
    { id: "entertainment", name: "Entertainment", icon: "🎬" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "education", name: "Education", icon: "📚" },
    { id: "salary", name: "Salary", icon: "💼" },
    { id: "freelance", name: "Freelance", icon: "💻" },
    { id: "investment", name: "Investment", icon: "📈" },
  ])

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: transaction?.description || "",
      amount: transaction ? Math.abs(transaction.amountCents / 100).toString() : "",
      type: transaction?.amountCents > 0 ? "income" : "expense",
      categoryId: transaction?.categoryId || "",
      accountId: transaction?.accountId || "",
      date: transaction?.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: transaction?.notes || "",
    },
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true)
      const accountsData = await apiClient.getAccounts({ isActive: true })
      setAccounts(accountsData)
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      toast({
        title: "Warning",
        description: "Failed to load accounts. Using fallback data.",
        variant: "destructive",
      })
      // Fallback to mock accounts
      setAccounts([
        { id: "1", name: "BCA Checking", type: "ASSET" },
        { id: "2", name: "Mandiri Savings", type: "ASSET" },
        { id: "3", name: "Cash Wallet", type: "ASSET" },
      ])
    } finally {
      setAccountsLoading(false)
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true)

    try {
      const amount = Number.parseFloat(data.amount)
      const transactionData = {
        description: data.description,
        amountCents: Math.round(amount * 100) * (data.type === "expense" ? -1 : 1),
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: new Date(data.date).toISOString(),
        notes: data.notes || undefined,
      }

      if (transaction) {
        await apiClient.updateTransaction(transaction.id, transactionData)
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        })
      } else {
        await apiClient.createTransaction(transactionData)
        toast({
          title: "Success",
          description: "Transaction created successfully",
        })
      }

      onSuccess?.()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save transaction",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return ""
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num)
  }

  const watchedType = form.watch("type")
  const watchedAmount = form.watch("amount")

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {watchedType === "income" ? (
            <Plus className="h-5 w-5 text-green-600" />
          ) : (
            <Minus className="h-5 w-5 text-red-600" />
          )}
          {transaction ? "Edit Transaction" : "Add New Transaction"}
        </CardTitle>
        <CardDescription>
          {transaction ? "Update transaction details" : "Enter the details for your new transaction"}
          {watchedAmount && (
            <Badge variant="outline" className="ml-2">
              {formatCurrency(watchedAmount)}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Amount (IDR)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value && formatCurrency(field.value)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter transaction description"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountsLoading ? (
                          <div className="p-2">
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ) : (
                          accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      disabled={loading}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className={`flex-1 ${
                  watchedType === "income" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {transaction ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {watchedType === "income" ? (
                      <Plus className="mr-2 h-4 w-4" />
                    ) : (
                      <Minus className="mr-2 h-4 w-4" />
                    )}
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
        </Form>
      </CardContent>
    </Card>
  )
}
