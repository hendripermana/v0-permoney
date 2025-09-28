"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import { DollarSign, TrendingUp, Users, Settings } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg">Permoney</span>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName || user?.username || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Budget categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your financial management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild className="justify-start h-auto p-4">
                <Link href="/transactions">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Add Transaction</div>
                      <div className="text-sm text-muted-foreground">Record income or expense</div>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/accounts">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Manage Accounts</div>
                      <div className="text-sm text-muted-foreground">Add or edit accounts</div>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/settings">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Settings</div>
                      <div className="text-sm text-muted-foreground">Configure your preferences</div>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/transactions">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">View Reports</div>
                      <div className="text-sm text-muted-foreground">Analyze your finances</div>
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to get the most out of Permoney
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Add your first account</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Create a budget</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Add some transactions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
