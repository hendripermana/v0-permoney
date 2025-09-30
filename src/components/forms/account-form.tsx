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
import { Switch } from "@/components/ui/switch"
import { 
  Loader2, 
  AlertCircle, 
  Wallet, 
  CreditCard, 
  Building2, 
  PiggyBank,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

// Validation schema
const accountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100, "Account name too long"),
  type: z.enum(["ASSET", "LIABILITY"], {
    required_error: "Account type is required",
  }),
  subtype: z.string().min(1, "Account subtype is required"),
  currency: z.string().min(3, "Currency is required").max(3, "Currency must be 3 characters"),
  initialBalance: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num)
  }, "Initial balance must be a valid number"),
  accountNumber: z.string().optional(),
  institutionName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type AccountFormData = z.infer<typeof accountSchema>

interface AccountFormProps {
  account?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const ACCOUNT_TYPES = [
  {
    value: "ASSET",
    label: "Asset",
    description: "Accounts that hold money (checking, savings, investments)",
    icon: Wallet,
    color: "text-green-600"
  },
  {
    value: "LIABILITY",
    label: "Liability", 
    description: "Accounts that owe money (credit cards, loans)",
    icon: CreditCard,
    color: "text-red-600"
  }
]

const ASSET_SUBTYPES = [
  { value: "BANK", label: "Bank Account", icon: "🏦" },
  { value: "SAVINGS", label: "Savings Account", icon: "💰" },
  { value: "INVESTMENT", label: "Investment Account", icon: "📈" },
  { value: "CASH", label: "Cash", icon: "💵" },
  { value: "CRYPTO", label: "Cryptocurrency", icon: "₿" },
  { value: "OTHER", label: "Other Asset", icon: "💼" },
]

const LIABILITY_SUBTYPES = [
  { value: "CREDIT_CARD", label: "Credit Card", icon: "💳" },
  { value: "LOAN", label: "Loan", icon: "🏠" },
  { value: "MORTGAGE", label: "Mortgage", icon: "🏡" },
  { value: "LINE_OF_CREDIT", label: "Line of Credit", icon: "📋" },
  { value: "OTHER", label: "Other Liability", icon: "📄" },
]

const CURRENCIES = [
  { value: "IDR", label: "Indonesian Rupiah (IDR)", symbol: "Rp" },
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "SGD", label: "Singapore Dollar (SGD)", symbol: "S$" },
  { value: "MYR", label: "Malaysian Ringgit (MYR)", symbol: "RM" },
]

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [showAccountNumber, setShowAccountNumber] = useState(false)

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || "",
      type: account?.type || "ASSET",
      subtype: account?.subtype || "",
      currency: account?.currency || "IDR",
      initialBalance: account?.balanceCents ? (account.balanceCents / 100).toString() : "0",
      accountNumber: account?.accountNumber || "",
      institutionName: account?.institutionName || "",
      description: account?.description || "",
      isActive: account?.isActive ?? true,
    },
  })

  const watchedType = form.watch("type")
  const watchedCurrency = form.watch("currency")
  const watchedBalance = form.watch("initialBalance")

  const onSubmit = async (data: AccountFormData) => {
    setLoading(true)

    try {
      const balance = parseFloat(data.initialBalance)
      const accountData = {
        name: data.name,
        type: data.type,
        subtype: data.subtype,
        currency: data.currency,
        balanceCents: Math.round(balance * 100),
        accountNumber: data.accountNumber || undefined,
        institutionName: data.institutionName || undefined,
        description: data.description || undefined,
        isActive: data.isActive,
      }

      if (account) {
        await apiClient.updateAccount(account.id, accountData)
        toast({
          title: "Success",
          description: "Account updated successfully",
        })
      } else {
        await apiClient.createAccount(accountData)
        toast({
          title: "Success",
          description: "Account created successfully",
        })
      }

      onSuccess?.()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return ""
    const currencyInfo = CURRENCIES.find(c => c.value === currency)
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(num)
  }

  const getSubtypes = () => {
    return watchedType === "ASSET" ? ASSET_SUBTYPES : LIABILITY_SUBTYPES
  }

  const selectedAccountType = ACCOUNT_TYPES.find(type => type.value === watchedType)
  const selectedCurrency = CURRENCIES.find(c => c.value === watchedCurrency)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {selectedAccountType && (
            <selectedAccountType.icon className={`h-5 w-5 ${selectedAccountType.color}`} />
          )}
          {account ? "Edit Account" : "Add New Account"}
        </CardTitle>
        <CardDescription>
          {account ? "Update account details" : "Create a new financial account"}
          {watchedBalance && selectedCurrency && (
            <Badge variant="outline" className="ml-2">
              {formatCurrency(watchedBalance, watchedCurrency)}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className={`h-4 w-4 ${type.color}`} />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., BCA Checking"
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
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Subtype</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subtype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubtypes().map((subtype) => (
                          <SelectItem key={subtype.value} value={subtype.value}>
                            <div className="flex items-center gap-2">
                              <span>{subtype.icon}</span>
                              {subtype.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Currency and Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{currency.symbol}</span>
                              {currency.label}
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
                name="initialBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {account ? "Current Balance" : "Initial Balance"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value && selectedCurrency && formatCurrency(field.value, selectedCurrency.value)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Institution Name (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Bank Central Asia"
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
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Account Number (Optional)
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={showAccountNumber ? "text" : "password"}
                        placeholder="Account number"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This information is encrypted and stored securely
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this account..."
                        disabled={loading}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Account
                      </FormLabel>
                      <FormDescription>
                        Include this account in calculations and reports
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className={`flex-1 ${
                  watchedType === "ASSET" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {account ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {selectedAccountType && (
                      <selectedAccountType.icon className="mr-2 h-4 w-4" />
                    )}
                    {account ? "Update Account" : "Create Account"}
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