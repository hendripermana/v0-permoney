"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { TransactionModal } from "@/components/modals/transaction-modal"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get transactions from API
      const apiTransactions = await apiClient.getTransactions({
        limit: 50,
        orderBy: "date",
        orderDirection: "desc",
      })

      // Transform API data to match component format
      const transformedTransactions = apiTransactions.map((transaction: any) => ({
        id: transaction.id,
        description: transaction.description || "Unknown Transaction",
        amount: transaction.amountCents / 100, // Convert from cents
        type: transaction.amountCents > 0 ? "income" : "expense",
        date: new Date(transaction.date || transaction.createdAt).toLocaleDateString("id-ID"),
        category: transaction.category?.name || "Uncategorized",
        account: transaction.account?.name || "Unknown Account",
      }))

      setTransactions(transformedTransactions)
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch transactions")

      // Fallback to mock data if API fails
      setTransactions(getMockTransactions())
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || transaction.category === selectedCategory
    const matchesType = selectedType === "all" || transaction.type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netFlow = totalIncome - totalExpenses

  const handleTransactionCreated = () => {
    fetchTransactions() // Refresh the transactions list
    setIsTransactionModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Track and manage all your financial transactions</p>
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>Using offline data - {error}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => setIsTransactionModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">
                From {transactions.filter((t) => t.type === "income").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                From {transactions.filter((t) => t.type === "expense").length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className={netFlow >= 0 ? "border-green-200" : "border-red-200"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
              <Target className={`h-4 w-4 ${netFlow >= 0 ? "text-green-500" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netFlow)}
              </div>
              <p className="text-xs text-muted-foreground">Net cash flow</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Transactions</CardTitle>
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
              <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions found matching your filters</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("all")
                      setSelectedType("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-600"
                            : transaction.type === "expense"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : transaction.type === "expense" ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{transaction.date}</span>
                          <span>•</span>
                          <span>{transaction.account}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-lg ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleTransactionCreated}
      />
    </div>
  )
}
