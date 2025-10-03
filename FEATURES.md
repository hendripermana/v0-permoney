# 🎨 Permoney - Enhanced Features & Design System

## 🚀 Recent Major Improvements

### 1. **Drag & Drop Customizable Dashboard** 🧩

Transform your dashboard experience with fully customizable layouts:

- **Drag & Drop Widgets**: Move any dashboard widget by simply dragging it
- **Resize on Demand**: Adjust widget sizes to fit your preferences
- **Persistent Layouts**: Your layout is automatically saved per user
- **Responsive Breakpoints**: Optimized layouts for desktop, tablet, and mobile
- **Edit Mode**: Toggle between view and edit modes with a single click

**Available Widgets:**
- Account Summary - Overview of all your accounts
- Recent Transactions - Latest financial activities
- Budget Overview - Budget tracking and progress
- Spending Patterns - Visualize spending by category
- Net Worth Tracker - Monitor assets vs liabilities

**How to Use:**
1. Click "Customize Layout" button on dashboard
2. Drag widgets to reposition
3. Resize by dragging corners (desktop only)
4. Click "Exit Edit Mode" to save

### 2. **Enhanced Design System** 🎨

Comprehensive design system with professional design tokens:

#### **Spacing System**
```css
xs:  8px   - Tight spacing for compact layouts
sm:  12px  - Small spacing for related items
md:  16px  - Base spacing (default)
lg:  24px  - Large spacing for sections
xl:  32px  - Extra large spacing
2xl: 48px  - Section dividers
3xl: 64px  - Major page sections
4xl: 96px  - Hero sections
```

#### **Typography Scale**
```css
Display: 3.5rem (56px) - Hero headings
H1:      2.5rem (40px) - Page titles
H2:      2rem (32px)   - Section titles
H3:      1.5rem (24px) - Subsection titles
H4:      1.25rem (20px)- Card titles
Body-lg: 1.125rem (18px) - Emphasized text
Body:    1rem (16px)   - Default text
Body-sm: 0.875rem (14px) - Small text
Caption: 0.75rem (12px) - Labels
```

#### **Elevation System**
```css
elevation-1: Subtle shadow for cards
elevation-2: Card hover states
elevation-3: Dropdowns and popovers
elevation-4: Modals and dialogs
elevation-5: Premium/featured elements
```

#### **Financial Color Palette**
```css
Success:  Green shades - Positive values, income
Warning:  Orange shades - Alerts, approaching limits
Danger:   Red shades - Negative values, expenses
Info:     Blue shades - Information, neutral
Income:   Bright green - Income transactions
Expense:  Bright red - Expense transactions
Neutral:  Gray - Transfers and neutral items
```

### 3. **Enhanced UI Component Library** 📦

**52 shadcn/ui Components:**
- Accordion, Alert, Avatar, Badge, Breadcrumb
- Button, Calendar, Card, Carousel, Chart
- Checkbox, Collapsible, Command, Context Menu
- Dialog, Drawer, Dropdown Menu, Form
- Hover Card, Input, Label, Loading States
- Menubar, Navigation Menu, Pagination
- Popover, Progress, Radio Group, Resizable
- Scroll Area, Select, Separator, Sheet
- Sidebar, Skeleton, Slider, Sonner Toast
- Switch, Table, Tabs, Textarea, Toast
- Toggle, Tooltip, and more...

**5+ Custom Enhanced Components:**

#### **StatCard**
Display key metrics with trends and badges:
```tsx
<StatCard
  title="Total Balance"
  value="$15,750"
  description="5 active accounts"
  icon={DollarSign}
  variant="success"
  trend={{ value: 5.2, direction: "up", label: "vs last month" }}
  badge={{ label: "Updated", variant: "secondary" }}
/>
```

#### **MetricCard**
Rich metric display with sparklines:
```tsx
<MetricCard
  title="Monthly Spending"
  value="$2,340"
  subtitle="This month"
  icon={TrendingDown}
  color="red"
  sparkline={[120, 150, 180, 160, 200, 190, 220]}
  change={{ value: 12.5, isPositive: false }}
/>
```

#### **EmptyState**
Beautiful empty states with actions:
```tsx
<EmptyState
  icon={Inbox}
  title="No transactions yet"
  description="Start tracking your finances by adding your first transaction"
  action={{
    label: "Add Transaction",
    onClick: handleAddTransaction
  }}
  variant="card"
/>
```

#### **DataGrid**
Responsive grid with auto-layout:
```tsx
<DataGrid columns={4} gap="lg" responsive>
  <Card>Widget 1</Card>
  <Card>Widget 2</Card>
  <Card>Widget 3</Card>
  <Card>Widget 4</Card>
</DataGrid>
```

#### **ResponsiveContainer**
Smart container with size variants:
```tsx
<ResponsiveContainer size="lg" padding>
  {/* Your content auto-centers with proper max-width */}
</ResponsiveContainer>
```

### 4. **Standardized TanStack Query Patterns** ⚡

All data fetching now follows consistent patterns:

#### **Accounts**
```tsx
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/hooks/use-accounts'

// In your component
const { data: accounts, isLoading } = useAccounts({ isActive: true })
const createAccount = useCreateAccount()
const updateAccount = useUpdateAccount()

// Create account
createAccount.mutate({
  name: "Checking Account",
  type: "ASSET",
  // ... other fields
})

// Update account
updateAccount.mutate({
  id: accountId,
  data: { name: "Updated Name" }
})
```

#### **Budgets**
```tsx
import { useBudgets, useCreateBudget } from '@/hooks/use-budgets-query'

const { data: budgets } = useBudgets({ isActive: true })
const createBudget = useCreateBudget()
```

#### **Transactions** (already implemented)
```tsx
import { useTransactions, useCreateTransaction } from '@/hooks/use-transactions-query'

const { data: transactions } = useTransactions({ limit: 10 })
const createTransaction = useCreateTransaction()
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Loading & error states
- ✅ Cache invalidation
- ✅ Retry logic

### 5. **Performance Optimizations** 🚀

- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Smart Caching**: 5-minute stale time, 10-minute garbage collection
- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive calculations cached
- **Background Refetch**: Data updates without blocking UI

### 6. **Mobile-First Responsive Design** 📱

Breakpoint system optimized for all devices:
```css
sm:  640px+  - Mobile landscape / Small tablets
md:  768px+  - Tablets
lg:  1024px+ - Laptops
xl:  1280px+ - Desktops
2xl: 1536px+ - Large displays
```

**Dashboard Layouts:**
- **Mobile (< 640px)**: Single column, stacked widgets
- **Tablet (640-1024px)**: 2 columns, optimized widget sizes
- **Desktop (1024px+)**: 3-4 columns, full customization

## 🎯 Usage Examples

### Creating a Custom Widget

```tsx
// src/components/dashboard/widgets/my-custom-widget.tsx
"use client"

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyCustomWidget({ data }: { data: any }) {
  return (
    <div className="p-4">
      <CardHeader>
        <CardTitle>My Custom Widget</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your widget content */}
      </CardContent>
    </div>
  )
}
```

### Using Enhanced Design Tokens

```tsx
// Spacing
<div className="space-y-lg p-xl">
  
// Typography
<h1 className="text-h1">Page Title</h1>
<p className="text-body-sm text-muted-foreground">

// Elevation
<Card className="shadow-elevation-2 hover:shadow-elevation-3">

// Colors
<Badge className="bg-success text-success-foreground">
<div className="text-income">+$500</div>
<div className="text-expense">-$250</div>
```

## 📚 Documentation

- **AGENTS.md** - Guidelines for AI agents and developers
- **QUICK_START.md** - Quick setup guide
- **DEVELOPMENT_SETUP_MAC_M1.md** - Mac M1 specific setup
- **docs/ARCHITECTURE.md** - System architecture
- **docs/DESIGN_SYSTEM.md** - Design system documentation

## 🔄 Migration Guide

### From Old Dashboard to New Dashboard

The dashboard has been completely refactored with drag & drop support. Your existing data is safe, and the new dashboard automatically migrates to the new system.

**What's Changed:**
- Dashboard now uses react-grid-layout
- Widgets are now separate components
- Layout is persisted per user in localStorage
- Edit mode toggle for customization

**What Stays the Same:**
- All your data (accounts, transactions, budgets)
- API endpoints and data fetching
- Authentication and authorization
- Page routes and navigation

### Updating Custom Components

If you have custom components, update them to use the new design tokens:

**Before:**
```tsx
<div className="mt-4 gap-4">
  <Card className="p-4">
```

**After:**
```tsx
<div className="space-y-md">
  <Card className="p-lg shadow-elevation-2">
```

## 🐛 Known Issues & Limitations

1. **Drag & Drop on Mobile**: Resizing is disabled on mobile for better UX
2. **Layout Persistence**: Stored in localStorage (not synced across devices yet)
3. **Widget Library**: Currently limited to 5 core widgets (more coming soon)

## 🔮 Upcoming Features

- [ ] Widget marketplace/library
- [ ] Export/import dashboard layouts
- [ ] Dashboard templates
- [ ] Real-time collaborative dashboards
- [ ] Advanced widget settings
- [ ] Custom widget creation UI
- [ ] Dashboard sharing via link

---

**Made with ❤️ by Permoney Team**
