/**
 * Sidebar Demo Component
 * Demonstrates the sidebar navigation and dashboard layout
 */

import React from 'react';
import {
  DashboardLayout,
  DashboardPage,
  DashboardGrid,
  DashboardSection,
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardContent,
  Button,
  Badge,
} from './index';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <PermoneyCard className="glassmorphism">
      <PermoneyCardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="h-12 w-12 bg-neon-green/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-neon-green" />
          </div>
        </div>
        <div className="flex items-center mt-4">
          {trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {change}
          </span>
          <span className="text-sm text-muted-foreground ml-1">
            from last month
          </span>
        </div>
      </PermoneyCardContent>
    </PermoneyCard>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

function QuickAction({
  title,
  description,
  icon: Icon,
  onClick,
}: QuickActionProps) {
  return (
    <PermoneyCard
      className="glassmorphism hover:scale-105 transition-transform duration-200 cursor-pointer"
      onClick={onClick}
    >
      <PermoneyCardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-neon-green/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-neon-green" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </PermoneyCardContent>
    </PermoneyCard>
  );
}

function RecentTransaction({
  description,
  amount,
  category,
  date,
}: {
  description: string;
  amount: string;
  category: string;
  date: string;
}) {
  const isExpense = amount.startsWith('-');

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-foreground">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
      <div
        className={`font-semibold ${
          isExpense ? 'text-red-500' : 'text-green-500'
        }`}
      >
        {amount}
      </div>
    </div>
  );
}

export function SidebarDemo() {
  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Handle navigation or modal opening here
  };

  return (
    <DashboardLayout>
      <DashboardPage
        title="Dashboard"
        description="Welcome back! Here's an overview of your financial activity."
        actions={
          <Button className="bg-neon-green hover:bg-neon-green/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        }
      >
        {/* Stats Overview */}
        <DashboardSection title="Overview">
          <DashboardGrid cols="4">
            <StatCard
              title="Total Balance"
              value="$12,345.67"
              change="+12.5%"
              trend="up"
              icon={DollarSign}
            />
            <StatCard
              title="Monthly Income"
              value="$5,420.00"
              change="+8.2%"
              trend="up"
              icon={TrendingUp}
            />
            <StatCard
              title="Monthly Expenses"
              value="$3,210.45"
              change="-5.1%"
              trend="down"
              icon={CreditCard}
            />
            <StatCard
              title="Savings Goal"
              value="$8,500.00"
              change="+15.3%"
              trend="up"
              icon={Target}
            />
          </DashboardGrid>
        </DashboardSection>

        {/* Quick Actions */}
        <DashboardSection title="Quick Actions">
          <DashboardGrid cols="2">
            <QuickAction
              title="Add Expense"
              description="Record a new expense transaction"
              icon={CreditCard}
              onClick={() => handleQuickAction('add-expense')}
            />
            <QuickAction
              title="Add Income"
              description="Record a new income transaction"
              icon={TrendingUp}
              onClick={() => handleQuickAction('add-income')}
            />
            <QuickAction
              title="Transfer Money"
              description="Transfer between accounts"
              icon={ArrowUpRight}
              onClick={() => handleQuickAction('transfer')}
            />
            <QuickAction
              title="Set Budget Goal"
              description="Create or update budget goals"
              icon={Target}
              onClick={() => handleQuickAction('budget-goal')}
            />
          </DashboardGrid>
        </DashboardSection>

        {/* Recent Activity */}
        <DashboardSection
          title="Recent Transactions"
          actions={
            <Button variant="outline" size="sm">
              View All
            </Button>
          }
        >
          <PermoneyCard className="glassmorphism">
            <PermoneyCardHeader>
              <PermoneyCardTitle>Latest Activity</PermoneyCardTitle>
            </PermoneyCardHeader>
            <PermoneyCardContent className="p-0">
              <RecentTransaction
                description="Coffee Shop"
                amount="-$4.50"
                category="Food & Dining"
                date="Today, 2:30 PM"
              />
              <RecentTransaction
                description="Salary Deposit"
                amount="+$3,200.00"
                category="Income"
                date="Yesterday, 9:00 AM"
              />
              <RecentTransaction
                description="Grocery Store"
                amount="-$67.89"
                category="Groceries"
                date="Yesterday, 6:15 PM"
              />
              <RecentTransaction
                description="Gas Station"
                amount="-$45.20"
                category="Transportation"
                date="2 days ago"
              />
              <RecentTransaction
                description="Freelance Payment"
                amount="+$850.00"
                category="Income"
                date="3 days ago"
              />
            </PermoneyCardContent>
          </PermoneyCard>
        </DashboardSection>
      </DashboardPage>
    </DashboardLayout>
  );
}
