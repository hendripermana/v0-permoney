# 🎨 Permoney Design System

## Overview
Comprehensive design system for Permoney financial management application. Built on top of shadcn/ui with custom financial-specific enhancements.

---

## 📐 Layout System

### PageContainer
Standard container for all pages. Ensures consistent max-width and padding.

```tsx
import { PageContainer } from '@/components/ui/enhanced'

<PageContainer size="xl">
  {/* Page content */}
</PageContainer>
```

**Props:**
- `size`: `"sm" | "md" | "lg" | "xl" | "full"` - Container max-width
- `className`: string - Additional classes
- `noPadding`: boolean - Disable default padding

**Sizes:**
- `sm`: 896px (56rem)
- `md`: 1152px (72rem)
- `lg`: 1280px (80rem)
- `xl`: 1440px (90rem) - **Default for pages**
- `full`: No max-width

### PageHeader
Standardized page header with title, description, and actions.

```tsx
import { PageHeader } from '@/components/ui/enhanced'

<PageHeader
  title="Page Title"
  description="Page description"
  actions={
    <>
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </>
  }
/>
```

### ContentSection
Wrapper for content sections with consistent spacing.

```tsx
import { ContentSection } from '@/components/ui/enhanced'

<ContentSection spacing="lg">
  {/* Section content */}
</ContentSection>
```

**Spacing:**
- `sm`: 1rem (space-y-4)
- `md`: 1.5rem (space-y-6)
- `lg`: 2rem (space-y-8) - **Default**
- `xl`: 3rem (space-y-12)

---

## 🎯 Financial Components

### TransactionItem
Reusable transaction display component.

```tsx
import { TransactionItem } from '@/components/ui/enhanced'

<TransactionItem
  id="tx-123"
  description="Groceries - Supermarket"
  amount={-450000}
  type="expense"
  date={new Date()}
  category="Food & Dining"
  account="BCA Checking"
  currency="IDR"
  onClick={() => handleClick()}
/>
```

**Props:**
- `type`: `"income" | "expense" | "transfer"`
- Automatically styled based on type
- Green for income, Red for expense, Blue for transfer

### BudgetItem
Reusable budget card component.

```tsx
import { BudgetItem } from '@/components/ui/enhanced'

<BudgetItem
  id="budget-123"
  category="Food & Dining"
  spent={2100000}
  budgeted={3000000}
  remaining={900000}
  percentage={70}
  transactions={24}
  currency="IDR"
  onClick={() => handleClick()}
/>
```

**Features:**
- Progress bar with percentage
- Status badges (On track, Warning, Over target)
- Transaction count
- Remaining balance

### AccountCard
Reusable account card component.

```tsx
import { AccountCard } from '@/components/ui/enhanced'

<AccountCard
  id="acc-123"
  name="BCA Checking"
  type="ASSET"
  subtype="BANK"
  balance={15750000}
  currency="IDR"
  isActive={true}
  icon={CreditCard}
  actions={
    <>
      <Button size="sm">View</Button>
      <Button size="sm">Edit</Button>
    </>
  }
/>
```

**Features:**
- Icon-based account types
- Asset/Liability color coding
- Active/Inactive badge
- Custom actions slot

---

## 🔄 State Components

### LoadingState
Unified loading component.

```tsx
import { LoadingState } from '@/components/ui/enhanced'

// Inline loading
<LoadingState message="Loading data..." variant="inline" />

// Card loading
<LoadingState message="Loading data..." variant="card" />

// Full page loading
<LoadingState message="Loading data..." fullPage />
```

**Variants:**
- `default`: Centered with padding
- `card`: Inside a Card component
- `inline`: Minimal inline display

### ErrorState
Unified error display component.

```tsx
import { ErrorState } from '@/components/ui/enhanced'

// Inline error
<ErrorState
  title="Something went wrong"
  message="Failed to load data"
  onRetry={handleRetry}
  variant="inline"
/>

// Full page error
<ErrorState
  title="Error"
  message="Failed to load data"
  onRetry={handleRetry}
  fullPage
/>
```

### EmptyState
Display when no data is available.

```tsx
import { EmptyState } from '@/components/ui/enhanced'

<EmptyState
  icon={Target}
  title="No data found"
  description="Get started by adding your first item"
  action={{
    label: "Add Item",
    onClick: handleAdd
  }}
  variant="card"
/>
```

---

## 🎨 Design Tokens

### Typography Scale

Use semantic typography tokens instead of manual classes:

```tsx
// ❌ Don't use
<h1 className="text-3xl font-bold">Title</h1>

// ✅ Do use
<h1 className="text-h2 font-bold">Title</h1>
```

**Available tokens:**
- `text-display`: 3.5rem (56px) - Hero text
- `text-h1`: 2.5rem (40px) - Main page title
- `text-h2`: 2rem (32px) - Section headings
- `text-h3`: 1.5rem (24px) - Card titles
- `text-h4`: 1.25rem (20px) - Subsection titles
- `text-body-lg`: 1.125rem (18px) - Large body text
- `text-body`: 1rem (16px) - Default body text
- `text-body-sm`: 0.875rem (14px) - Small body text
- `text-caption`: 0.75rem (12px) - Captions/labels

### Spacing Scale

Use consistent spacing tokens:

```tsx
// ❌ Don't use
<div className="space-y-6">

// ✅ Do use
<div className="space-y-lg">
```

**Available tokens:**
- `space-xs` / `gap-xs`: 0.5rem (8px)
- `space-sm` / `gap-sm`: 0.75rem (12px)
- `space-md` / `gap-md`: 1rem (16px)
- `space-lg` / `gap-lg`: 1.5rem (24px) - **Default for sections**
- `space-xl` / `gap-xl`: 2rem (32px)
- `space-2xl` / `gap-2xl`: 3rem (48px)
- `space-3xl` / `gap-3xl`: 4rem (64px)
- `space-4xl` / `gap-4xl`: 6rem (96px)

### Financial Colors

Semantic colors for financial data:

```tsx
// Income/Positive
text-green-600 dark:text-green-400
bg-green-50 dark:bg-green-950
border-green-200 dark:border-green-800

// Expense/Negative
text-red-600 dark:text-red-400
bg-red-50 dark:bg-red-950
border-red-200 dark:border-red-800

// Transfer/Neutral
text-blue-600 dark:text-blue-400
bg-blue-50 dark:bg-blue-950
border-blue-200 dark:border-blue-800
```

### Status Colors

```tsx
// Success
text-green-700 dark:text-green-300
bg-green-50 dark:bg-green-950
border-green-200 dark:border-green-800

// Warning
text-yellow-700 dark:text-yellow-300
bg-yellow-50 dark:bg-yellow-950
border-yellow-200 dark:border-yellow-800

// Danger
text-red-700 dark:text-red-300
bg-red-50 dark:bg-red-950
border-red-200 dark:border-red-800

// Info
text-blue-700 dark:text-blue-300
bg-blue-50 dark:bg-blue-950
border-blue-200 dark:border-blue-800
```

---

## 🃏 Card Patterns

### Summary Card
For displaying metrics and statistics:

```tsx
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
      From {count} transactions
    </p>
  </CardContent>
</Card>
```

**Pattern:**
- Left border with semantic color (4px)
- Icon in header
- Large value in h3
- Caption with context

### Data Card
For displaying lists or detailed information:

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Description text</CardDescription>
      </div>
      <Button size="sm">Action</Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

---

## 📱 Responsive Guidelines

### Grid Layouts

Use consistent grid patterns:

```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 1 column on mobile, 2 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// 1 column on mobile, 4 on desktop (for summary cards)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Flexbox Patterns

```tsx
// Header with actions
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <div>
    <h1>Title</h1>
    <p>Description</p>
  </div>
  <div className="flex items-center gap-2">
    <Button>Action</Button>
  </div>
</div>
```

---

## 🎯 Best Practices

### 1. Always Use Layout Components

```tsx
// ✅ Good
export default function MyPage() {
  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader title="Title" description="Description" />
        {/* Content */}
      </ContentSection>
    </PageContainer>
  )
}

// ❌ Bad
export default function MyPage() {
  return (
    <div className="w-full px-4">
      <h1>Title</h1>
      {/* Content */}
    </div>
  )
}
```

### 2. Use Enhanced Components

```tsx
// ✅ Good
<TransactionItem {...transaction} />

// ❌ Bad
<div className="flex items-center justify-between p-4 border rounded">
  {/* Manual transaction styling */}
</div>
```

### 3. Use Design Tokens

```tsx
// ✅ Good
<h1 className="text-h2">Title</h1>
<div className="space-y-lg">

// ❌ Bad
<h1 className="text-3xl font-bold">Title</h1>
<div className="space-y-8">
```

### 4. Consistent State Handling

```tsx
// ✅ Good
if (loading) return <LoadingState fullPage />
if (error) return <ErrorState message={error} onRetry={refetch} fullPage />
if (data.length === 0) return <EmptyState {...emptyProps} />

// ❌ Bad
if (loading) return <div>Loading...</div>
```

### 5. Use Semantic Colors

```tsx
// ✅ Good - Financial colors
<p className="text-green-600 dark:text-green-400">+{formatCurrency(income)}</p>

// ✅ Good - Status colors  
<Badge variant="success">On track</Badge>

// ❌ Bad - Hardcoded colors
<p className="text-green-500">Income</p>
```

---

## 🔧 Migration Guide

### From Old Pattern to New Pattern

**1. Page Structure**

```tsx
// Before
export default function Page() {
  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-6">
        <h1 className="text-3xl font-bold">Title</h1>
        {/* Content */}
      </div>
    </div>
  )
}

// After
export default function Page() {
  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader title="Title" description="..." />
        {/* Content */}
      </ContentSection>
    </PageContainer>
  )
}
```

**2. Loading States**

```tsx
// Before
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin" />
      <span>Loading...</span>
    </div>
  )
}

// After
if (loading) {
  return (
    <PageContainer>
      <LoadingState message="Loading..." fullPage />
    </PageContainer>
  )
}
```

**3. Transaction Lists**

```tsx
// Before
{transactions.map(tx => (
  <div key={tx.id} className="flex items-center justify-between p-4 border rounded">
    <div>{tx.description}</div>
    <div>{formatCurrency(tx.amount)}</div>
  </div>
))}

// After
{transactions.map(tx => (
  <TransactionItem key={tx.id} {...tx} />
))}
```

---

## 🎨 Theme System

### Light/Dark Mode Support

All components automatically support dark mode through CSS variables. Always use semantic colors that adapt:

```tsx
// ✅ Adapts to theme
className="bg-card text-card-foreground"
className="text-green-600 dark:text-green-400"

// ❌ Doesn't adapt
className="bg-white text-black"
```

### Theme Toggle

Users can switch between:
- **Light**: Bright, clear interface
- **Dark**: Easy on the eyes at night
- **System**: Matches device preferences

Theme is persisted in localStorage and syncs across tabs.

---

## 📚 Component Library

All enhanced components are exported from a single import:

```tsx
import {
  // Layout
  PageContainer,
  PageHeader,
  ContentSection,
  
  // Financial
  TransactionItem,
  BudgetItem,
  AccountCard,
  
  // States
  LoadingState,
  LoadingSkeleton,
  ErrorState,
  EmptyState,
  
  // Utilities
  StatCard,
  MetricCard,
  DataGrid,
  ResponsiveContainer,
} from '@/components/ui/enhanced'
```

---

## 🚀 Quick Start

### Creating a New Page

```tsx
"use client"

import { useState, useEffect } from "react"
import {
  PageContainer,
  PageHeader,
  ContentSection,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/enhanced"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function NewPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch data
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="Loading data..." fullPage />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={fetchData}
          fullPage
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer size="xl">
      <ContentSection spacing="lg">
        <PageHeader
          title="Page Title"
          description="Page description"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          }
        />

        {data.length === 0 ? (
          <EmptyState
            title="No data found"
            description="Get started by adding your first item"
            action={{
              label: "Add Item",
              onClick: handleAdd
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Render data */}
          </div>
        )}
      </ContentSection>
    </PageContainer>
  )
}
```

---

## ✅ Checklist for New Features

When adding new pages or features:

- [ ] Use `PageContainer` for layout
- [ ] Use `PageHeader` for title/description
- [ ] Use `ContentSection` for spacing
- [ ] Use `LoadingState` for loading
- [ ] Use `ErrorState` for errors
- [ ] Use `EmptyState` for no data
- [ ] Use enhanced components (TransactionItem, BudgetItem, etc.)
- [ ] Use design tokens for typography (`text-h2`, `text-body`)
- [ ] Use design tokens for spacing (`space-lg`, `gap-md`)
- [ ] Use semantic financial colors
- [ ] Support dark mode
- [ ] Ensure responsive design
- [ ] Add proper TypeScript types

---

## 📖 Additional Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **Design Tokens**: `/src/lib/design-system/tokens.ts`
- **Component Variants**: `/src/lib/design-system/variants.ts`

---

**Last Updated**: January 2024  
**Version**: 1.0.0
