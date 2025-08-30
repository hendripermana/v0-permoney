"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, type AnalyticsFilters } from "@/lib/api-client"
import { useState, useEffect } from "react"

export interface UseDashboardOptions {
  householdId?: string
  filters?: AnalyticsFilters
  refetchInterval?: number
  enabled?: boolean
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const queryClient = useQueryClient()
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null)

  // Get current household if not provided
  useEffect(() => {
    if (!options.householdId && !currentHouseholdId) {
      apiClient
        .getCurrentHousehold()
        .then((household) => {
          if (household?.id) {
            setCurrentHouseholdId(household.id)
          }
        })
        .catch((error) => {
          console.error("Failed to get current household:", error)
        })
    }
  }, [options.householdId, currentHouseholdId])

  const householdId = options.householdId || currentHouseholdId

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["dashboard", householdId, options.filters],
    queryFn: () => {
      if (!householdId) {
        throw new Error("No household ID available")
      }
      return apiClient.getDashboardData(householdId, options.filters)
    },
    enabled: options.enabled !== false && !!householdId,
    refetchInterval: options.refetchInterval || false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes("4")) {
        return false
      }
      return failureCount < 3
    },
  })

  // Separate queries for individual components that might need different refresh rates
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts", householdId],
    queryFn: () => {
      if (!householdId) throw new Error("No household ID")
      return apiClient.getAccounts(householdId)
    },
    enabled: !!householdId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const { data: netWorthSummary, isLoading: netWorthLoading } = useQuery({
    queryKey: ["net-worth", householdId],
    queryFn: () => {
      if (!householdId) throw new Error("No household ID")
      return apiClient.getNetWorth(householdId)
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", householdId, "recent"],
    queryFn: () => {
      if (!householdId) throw new Error("No household ID")
      return apiClient.getTransactions(householdId, { limit: 10, page: 1 })
    },
    enabled: !!householdId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Helper functions
  const refreshDashboard = () => {
    return refetch()
  }

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["accounts"] })
    queryClient.invalidateQueries({ queryKey: ["net-worth"] })
    queryClient.invalidateQueries({ queryKey: ["transactions"] })
  }

  const updateFilters = (newFilters: AnalyticsFilters) => {
    queryClient.invalidateQueries({
      queryKey: ["dashboard", householdId, newFilters],
    })
  }

  // Format data for easier consumption
  const formattedData = dashboardData
    ? {
        ...dashboardData,
        // Convert BigInt to numbers for easier handling in components
        summary: {
          ...dashboardData.summary,
          netWorth: {
            ...dashboardData.summary.netWorth,
            amount: Number(dashboardData.summary.netWorth.cents) / 100,
          },
          totalAssets: {
            ...dashboardData.summary.totalAssets,
            amount: Number(dashboardData.summary.totalAssets.cents) / 100,
          },
          totalLiabilities: {
            ...dashboardData.summary.totalLiabilities,
            amount: Number(dashboardData.summary.totalLiabilities.cents) / 100,
          },
          monthlyIncome: {
            ...dashboardData.summary.monthlyIncome,
            amount: Number(dashboardData.summary.monthlyIncome.cents) / 100,
          },
          monthlyExpenses: {
            ...dashboardData.summary.monthlyExpenses,
            amount: Number(dashboardData.summary.monthlyExpenses.cents) / 100,
          },
          monthlySavings: {
            ...dashboardData.summary.monthlySavings,
            amount: Number(dashboardData.summary.monthlySavings.cents) / 100,
          },
        },
      }
    : null

  return {
    // Main dashboard data
    data: formattedData,
    isLoading,
    error,
    isRefetching,

    // Individual data pieces
    accounts,
    accountsLoading,
    netWorthSummary,
    netWorthLoading,
    recentTransactions,
    transactionsLoading,

    // Actions
    refresh: refreshDashboard,
    refreshAll,
    updateFilters,

    // State
    householdId,
    hasData: !!dashboardData,
    isEmpty: !isLoading && !dashboardData,
  }
}

export default useDashboard
