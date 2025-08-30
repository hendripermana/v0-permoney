'use client';

import { Button } from '@/components/ui/button';
import {
  DashboardLayout,
  DashboardContent,
} from '@/components/layout/dashboard-layout';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { AccountCard } from '@/components/dashboard/account-card';
import {
  NetWorthChart,
  generateSampleNetWorthData,
} from '@/components/dashboard/net-worth-chart';
import {
  SankeyChart,
  createCashflowData,
} from '@/components/dashboard/sankey-chart';
import {
  Plus,
  CreditCard,
  Target,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Mock data for demonstration
const mockSummaryData = {
  totalBalance: 45750000,
  monthlyIncome: 15000000,
  monthlyExpenses: 8500000,
  savingsGoal: 100000000,
  currentSavings: 25000000,
  totalAssets: 65750000,
  totalLiabilities: 20000000,
  netWorth: 45750000,
  // Trend data (percentage change from previous period)
  balanceChange: 12.5,
  incomeChange: 5.2,
  expenseChange: -2.1,
  netWorthChange: 8.7,
};

const mockAccounts = [
  {
    id: '1',
    name: 'BCA Checking',
    type: 'ASSET' as const,
    subtype: 'CHECKING',
    balance: 25000000,
    currency: 'IDR',
    accountNumber: '1234567890',
    institution: {
      name: 'Bank Central Asia',
      code: 'BCA',
      color: 'bg-blue-600',
    },
    isActive: true,
  },
  {
    id: '2',
    name: 'BNI Savings',
    type: 'ASSET' as const,
    subtype: 'SAVINGS',
    balance: 15750000,
    currency: 'IDR',
    accountNumber: '5678901234',
    institution: {
      name: 'Bank Negara Indonesia',
      code: 'BNI',
      color: 'bg-orange-600',
    },
    isActive: true,
  },
  {
    id: '3',
    name: 'Cash Wallet',
    type: 'ASSET' as const,
    subtype: 'CASH',
    balance: 5000000,
    currency: 'IDR',
    accountNumber: 'CASH001',
    isActive: true,
  },
  {
    id: '4',
    name: 'GoPay',
    type: 'ASSET' as const,
    subtype: 'GOPAY',
    balance: 2500000,
    currency: 'IDR',
    accountNumber: '081234567890',
    institution: {
      name: 'GoPay',
      code: 'GOPAY',
      color: 'bg-green-500',
    },
    isActive: true,
  },
  {
    id: '5',
    name: 'BCA Credit Card',
    type: 'LIABILITY' as const,
    subtype: 'CREDIT_CARD',
    balance: -3500000,
    currency: 'IDR',
    accountNumber: '4567890123456789',
    institution: {
      name: 'Bank Central Asia',
      code: 'BCA',
      color: 'bg-blue-600',
    },
    isActive: true,
  },
];

// Generate sample data
const netWorthData = generateSampleNetWorthData(12);
const cashflowData = createCashflowData(
  { salary: 12000000, freelance: 2500000, investments: 500000 },
  {
    housing: 4000000,
    food: 2500000,
    transport: 1500000,
    entertainment: 1000000,
    savings: 6000000,
  }
);

function DashboardSidebar() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="ghost">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <CreditCard className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Target className="mr-2 h-4 w-4" />
            Set Budget
          </Button>
          <Button className="w-full justify-start" variant="ghost">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-neon-green rounded-full"></div>
            <div className="flex-1 text-sm">
              <div className="font-medium">Salary received</div>
              <div className="text-muted-foreground">
                {formatCurrency(15000000)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="flex-1 text-sm">
              <div className="font-medium">Grocery shopping</div>
              <div className="text-muted-foreground">
                {formatCurrency(750000)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 text-sm">
              <div className="font-medium">Utility payment</div>
              <div className="text-muted-foreground">
                {formatCurrency(450000)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Export Options
        </h3>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="ghost" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button className="w-full justify-start" variant="ghost" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout sidebar={<DashboardSidebar />}>
      <DashboardContent>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s your comprehensive financial overview.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="permoney">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards data={mockSummaryData} />

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Net Worth Chart */}
            <NetWorthChart
              data={netWorthData}
              title="Net Worth Trend"
              description="Track your financial progress over time"
              showAssetLiabilityBreakdown={false}
            />

            {/* Account Cards Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Accounts</h2>
              <div className="grid grid-cols-1 gap-4">
                {mockAccounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    showBalance={true}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Cashflow Sankey Chart */}
            <SankeyChart
              data={cashflowData}
              title="Monthly Cash Flow"
              description="Visualize how your money flows from income to expenses"
            />

            {/* Net Worth with Asset/Liability Breakdown */}
            <NetWorthChart
              data={netWorthData}
              title="Assets vs Liabilities"
              description="Detailed breakdown of your financial position"
              showAssetLiabilityBreakdown={true}
            />
          </div>
        </div>

        {/* Additional Insights Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Financial Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="permoney-card p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(
                  ((mockSummaryData.monthlyIncome -
                    mockSummaryData.monthlyExpenses) /
                    mockSummaryData.monthlyIncome) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-xs text-muted-foreground mt-1">
                You&apos;re saving{' '}
                {formatCurrency(
                  mockSummaryData.monthlyIncome -
                    mockSummaryData.monthlyExpenses
                )}{' '}
                monthly
              </p>
            </div>

            <div className="permoney-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.ceil(
                  mockSummaryData.savingsGoal /
                    (mockSummaryData.monthlyIncome -
                      mockSummaryData.monthlyExpenses)
                )}
              </div>
              <p className="text-sm text-muted-foreground">Months to Goal</p>
              <p className="text-xs text-muted-foreground mt-1">
                At current savings rate
              </p>
            </div>

            <div className="permoney-card p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(
                  (mockSummaryData.totalLiabilities /
                    mockSummaryData.totalAssets) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-muted-foreground">
                Debt-to-Asset Ratio
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lower is better
              </p>
            </div>
          </div>
        </div>
      </DashboardContent>
    </DashboardLayout>
  );
}
