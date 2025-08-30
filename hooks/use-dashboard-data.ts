"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface DashboardData {
  accounts: any[]
  transactions: any[]
  budgets: any[]
  analytics: any
  netWorth: any
  accountStats: any
}

interface UseDashboardDataReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date range (last 30 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        currency: "IDR",
      }

      // Fetch all dashboard data in parallel
      const [accounts, transactions, budgets, netWorth, accountStats] = await Promise.all([
        apiClient.getAccounts({ isActive: true }),
        apiClient.getTransactions({
          limit: 10,
          orderBy: "createdAt",
          orderDirection: "desc",
        }),
        apiClient.getBudgets({ isActive: true }),
        apiClient.getNetWorth("IDR"),
        apiClient.getAccountStats(),
      ])

      // Try to get analytics data (might fail if not authenticated)
      const analytics = null
      try {
        // Note: This would need householdId from auth context
        // analytics = await apiClient.getDashboardAnalytics('household-id', filters)
      } catch (analyticsError) {
        console.warn("Analytics data not available:", analyticsError)
      }

      setData({
        accounts,
        transactions,
        budgets,
        analytics,
        netWorth,
        accountStats,
      })
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")

      // Fallback to mock data if API fails
      setData({
        accounts: getMockAccounts(),
        transactions: getMockTransactions(),
        budgets: getMockBudgets(),
        analytics: null,
        netWorth: getMockNetWorth(),
        accountStats: getMockAccountStats(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const refetch = async () => {
    await fetchDashboardData()
  }

  return { data, loading, error, refetch }
}

// Fallback mock data functions
function getMockAccounts() {
  return [
    {
      id: "1",
      name: "BCA Checking",
      type: "ASSET",
      subtype: "checking",
      calculatedBalance: 1575000000, // 15,750,000 in cents
      currency: "IDR",
      isActive: true,
    },
    {
      id: "2",
      name: "Mandiri Savings",
      type: "ASSET",
      subtype: "savings",
      calculatedBalance: 4520000000, // 45,200,000 in cents
      currency: "IDR",
      isActive: true,
    },
    {
      id: "3",
      name: "Cash Wallet",
      type: "ASSET",
      subtype: "cash",
      calculatedBalance: 250000000, // 2,500,000 in cents
      currency: "IDR",
      isActive: true,
    },
  ]
}

function getMockTransactions() {
  return [
    {
      id: "1",
      description: "Grocery Shopping",
      amountCents: -50000000, // -500,000 in cents
      currency: "IDR",
      date: new Date().toISOString(),
      category: { name: "Food & Dining", icon: "🍽️" },
      account: { name: "BCA Checking" },
    },
    {
      id: "2",
      description: "Salary",
      amountCents: 1000000000, // 10,000,000 in cents
      currency: "IDR",
      date: new Date(Date.now() - 86400000).toISOString(),
      category: { name: "Income", icon: "💰" },
      account: { name: "BCA Checking" },
    },
  ]
}

function getMockBudgets() {
  return [
    {
      id: "1",
      name: "Monthly Budget",
      totalAllocatedCents: 800000000, // 8,000,000 in cents
      currency: "IDR",
      period: "MONTHLY",
      isActive: true,
      categories: [
        {
          categoryId: "1",
          category: { name: "Food & Dining" },
          allocatedAmountCents: 300000000,
          spentAmountCents: 150000000,
        },
      ],
    },
  ]
}

function getMockNetWorth() {
  return {
    totalAssets: 6345000000, // 63,450,000 in cents
    totalLiabilities: 0,
    netWorth: 6345000000,
    currency: "IDR",
  }
}

function getMockAccountStats() {
  return {
    totalAccounts: 3,
    activeAccounts: 3,
    assetAccounts: 3,
    liabilityAccounts: 0,
    currenciesUsed: ["IDR"],
  }
}
