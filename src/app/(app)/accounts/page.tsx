"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  RefreshCw,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { formatCurrency, fromCents, safeNumber } from "@/lib/utils"
import { AccountModal } from "@/components/modals/account-modal"
import {
  PageContainer,
  PageHeader,
  ContentSection,
  LoadingState,
  ErrorState,
  AccountCard,
  EmptyState,
} from "@/components/ui/enhanced"

const getAccountIcon = (type: string, subtype: string) => {
  if (type === "LIABILITY") return CreditCard

  switch (subtype?.toUpperCase()) {
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

      const transformedAccounts = accountsData.map((account: any) => {
        const balanceCents = safeNumber(
          account.balanceCents ?? account.currentBalanceCents ?? account.calculatedBalance,
          0,
        )
        const currency = account.currency ?? "IDR"

        return {
          ...account,
          balanceCents,
          balance: fromCents(balanceCents),
          currency,
          icon: getAccountIcon(account.type, account.subtype),
        }
      })

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
          balanceCents: 1575000000,
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
          balanceCents: 4520000000,
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
          balanceCents: 250000000,
          currency: "IDR",
          isActive: true,
          icon: Wallet,
        },
      ])
    } finally {
      setLoading(false)
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
    toast({
      title: "Refreshed",
      description: "Accounts have been updated",
    })
  }

  const handleAccountSuccess = () => {
    fetchAccounts()
    setIsAccountModalOpen(false)
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const assetAccounts = accounts.filter(account => account.type === "ASSET")
  const liabilityAccounts = accounts.filter(account => account.type === "LIABILITY")

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading accounts..." fullPage />
      </PageContainer>
    )
  }

  if (error && accounts.length === 0) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={fetchAccounts}
          fullPage
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader
          title="Accounts"
          description="Manage your financial accounts and track balances"
          actions={
            <>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button onClick={handleAddAccount}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
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
        <div className="w-full grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-green-600 dark:text-green-400">
                {formatCurrency(assetAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </div>
              <p className="text-caption text-muted-foreground">
                {assetAccounts.length} asset account{assetAccounts.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Total Liabilities</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-red-600 dark:text-red-400">
                {formatCurrency(liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </div>
              <p className="text-caption text-muted-foreground">
                {liabilityAccounts.length} liability account{liabilityAccounts.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Net Worth</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-caption text-muted-foreground">
                Across {accounts.length} accounts
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-body font-medium">Active Accounts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-h3 font-bold">
                {accounts.filter(acc => acc.isActive).length}
              </div>
              <p className="text-caption text-muted-foreground">
                of {accounts.length} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No accounts found"
            description="Get started by adding your first financial account"
            action={{
              label: "Add Your First Account",
              onClick: handleAddAccount,
            }}
            variant="card"
          />
        ) : (
          <div className="w-full grid grid-cols-1 gap-6">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                {...account}
                actions={
                  <>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditAccount(account)
                      }}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAccount(account.id)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </ContentSection>
      
      <AccountModal
        open={isAccountModalOpen}
        onOpenChange={setIsAccountModalOpen}
        account={selectedAccount}
        onSuccess={handleAccountSuccess}
      />
    </PageContainer>
  )
}
