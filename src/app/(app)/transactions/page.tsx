"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Download,
  RefreshCw,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { TransactionModal } from "@/components/modals/transaction-modal"
import { formatCurrency, formatShortDate, fromCents } from "@/lib/utils"
import {
  PageContainer,
  PageHeader,
  ContentSection,
  LoadingState,
  ErrorState,
  TransactionItem,
  EmptyState,
} from "@/components/ui/enhanced"
import { toast } from "@/hooks/use-toast"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const normalizeTransaction = (transaction: any) => {
    const amountFromCents = typeof transaction.amountCents === "number"
      ? fromCents(transaction.amountCents)
      : null

    const rawAmount = amountFromCents ?? (typeof transaction.amount === "number" ? transaction.amount : 0)
    const amountCents = typeof transaction.amountCents === "number"
      ? transaction.amountCents
      : Math.round(rawAmount * 100)

    const isoDate = transaction.date ?? transaction.createdAt ?? new Date().toISOString()
    const date = new Date(isoDate)

    const type = rawAmount > 0 ? "income" : rawAmount < 0 ? "expense" : "transfer"

    return {
      id: String(transaction.id ?? `${isoDate}-${transaction.description ?? "tx"}`),
      description: transaction.description || "Unknown Transaction",
      amount: rawAmount,
      amountCents,
      type,
      date,
      formattedDate: formatShortDate(date),
      category: transaction.category?.name || transaction.category || "Uncategorized",
      account: transaction.account?.name || transaction.account || "Unknown Account",
      currency: transaction.currency || "IDR",
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiTransactions = await apiClient.getTransactions({
        limit: 50,
        orderBy: "date",
        orderDirection: "desc",
      })

      const transactionsArray = Array.isArray(apiTransactions) ? apiTransactions : []
      const transformedTransactions = transactionsArray.map(normalizeTransaction)

      setTransactions(transformedTransactions)
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch transactions")

      setTransactions(getMockTransactions().map(normalizeTransaction))
    } finally {
      setLoading(false)
    }
  }

  const getMockTransactions = () => [
    {
      id: 1,
      description: "Salary - PT Tech Indonesia",
      amount: 12500000,
      type: "income",
      date: "2024-01-15",
      category: "Salary",
      account: "BCA Checking",
    },
    {
      id: 2,
      description: "Groceries - Superindo",
      amount: -450000,
      type: "expense",
      date: "2024-01-14",
      category: "Food",
      account: "BCA Checking",
    },
    {
      id: 3,
      description: "Electricity Bill - PLN",
      amount: -275000,
      type: "expense",
      date: "2024-01-13",
      category: "Utilities",
      account: "BCA Checking",
    },
    {
      id: 4,
      description: "Investment - Mutual Fund",
      amount: -1000000,
      type: "investment",
      date: "2024-01-12",
      category: "Investment",
      account: "Mandiri Savings",
    },
    {
      id: 5,
      description: "Freelance Project Payment",
      amount: 2500000,
      type: "income",
      date: "2024-01-11",
      category: "Freelance",
      account: "BCA Checking",
    },
  ]

  const categories = ["all", "Food", "Transportation", "Utilities", "Investment", "Salary", "Freelance", "Education"]
  const types = ["all", "income", "expense", "investment"]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory
    const matchesType = selectedType === "all" || transaction.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netFlow = totalIncome - totalExpenses

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTransactions()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Transactions have been updated",
    })
  }

  const handleTransactionCreated = () => {
    fetchTransactions()
    setIsTransactionModalOpen(false)
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading transactions..." fullPage />
      </PageContainer>
    )
  }

  if (error && transactions.length === 0) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={fetchTransactions}
          fullPage
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader
          title="Transactions"
          description="Track and manage all your financial transactions"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => setIsTransactionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </>
          }
        />

        {error && (
          <ErrorState
            variant="inline"
            title="Warning"
            message={`Using offline data - ${error}`}
          />
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-caption text-muted-foreground">
                From {transactions.filter((t) => t.type === "income").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-caption text-muted-foreground">
                From {transactions.filter((t) => t.type === "expense").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${netFlow >= 0 ? "border-l-green-500" : "border-l-red-500"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Net Flow</CardTitle>
              <Target className={`h-4 w-4 ${netFlow >= 0 ? "text-green-500" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-h3 font-bold ${
                netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {formatCurrency(netFlow)}
              </div>
              <p className="text-caption text-muted-foreground">Net cash flow</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-body-lg">Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No transactions found"
                description="Try adjusting your filters or add a new transaction"
                action={{
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedType("all")
                  },
                }}
                variant="minimal"
              />
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    {...transaction}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ContentSection>

      <TransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        onSuccess={handleTransactionCreated}
      />
    </PageContainer>
  )
}
