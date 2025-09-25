"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AccountModal } from "@/components/modals/account-modal"
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  Building2,
  TrendingUp,
  Edit,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      const accountsData = await apiClient.getAccounts({ isActive: true })
      
      // Transform API data to include icons
      const transformedAccounts = accountsData.map((account: any) => ({
        ...account,
        balance: account.balanceCents / 100,
        icon: getAccountIcon(account.type, account.subtype),
      }))
      
      setAccounts(transformedAccounts)
    } catch (err) {
      console.error("Failed to fetch accounts:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch accounts")
      
      // Fallback to mock data
      setAccounts([
        {
          id: "1",
          name: "BCA Checking",
          type: "ASSET",
          subtype: "BANK",
          balance: 15750000,
          currency: "IDR",
          isActive: true,
          icon: CreditCard,
        },
        {
          id: "2",
          name: "Mandiri Savings",
          type: "ASSET",
          subtype: "SAVINGS",
          balance: 45200000,
          currency: "IDR",
          isActive: true,
          icon: PiggyBank,
        },
        {
          id: "3",
          name: "Cash Wallet",
          type: "ASSET",
          subtype: "CASH",
          balance: 2500000,
          currency: "IDR",
          isActive: true,
          icon: Wallet,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getAccountIcon = (type: string, subtype: string) => {
    if (type === "LIABILITY") return CreditCard
    
    switch (subtype) {
      case "BANK":
      case "CHECKING":
        return CreditCard
      case "SAVINGS":
        return PiggyBank
      case "INVESTMENT":
        return TrendingUp
      case "CASH":
        return Wallet
      default:
        return Building2
    }
  }

  const handleAddAccount = () => {
    setSelectedAccount(null)
    setIsAccountModalOpen(true)
  }

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account)
    setIsAccountModalOpen(true)
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return
    
    try {
      await apiClient.deleteAccount(accountId)
      toast({
        title: "Success",
        description: "Account deleted successfully",
      })
      fetchAccounts()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAccounts()
    setRefreshing(false)
  }

  const handleAccountSuccess = () => {
    fetchAccounts()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const assetAccounts = accounts.filter(account => account.type === "ASSET")
  const liabilityAccounts = accounts.filter(account => account.type === "LIABILITY")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts and track balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={handleAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(assetAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">{assetAccounts.length} asset accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">{liabilityAccounts.length} liability accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across {accounts.length} accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(acc => acc.isActive).length}</div>
            <p className="text-xs text-muted-foreground">of {accounts.length} total</p>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first financial account
            </p>
            <Button onClick={handleAddAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const IconComponent = account.icon
            const isAsset = account.type === "ASSET"
            return (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isAsset ? "bg-green-100" : "bg-red-100"
                      }`}>
                        <IconComponent className={`h-6 w-6 ${
                          isAsset ? "text-green-600" : "text-red-600"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>
                          {account.subtype || account.type} • {account.currency}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${
                        isAsset ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(account.balance)}
                      </p>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      <AccountModal
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
        account={selectedAccount}
        onSuccess={handleAccountSuccess}
      />
    </div>
  )
}
