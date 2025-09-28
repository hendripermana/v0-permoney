# 🎨 Design System & Patterns

## Overview
This document defines the design system, patterns, and guidelines for the Permoney application. It ensures consistency across the entire application and provides clear guidance for developers and designers.

## 🎯 Design Principles

### 1. Simplicity First
- Clean, minimal interface
- Focus on essential functionality
- Reduce cognitive load
- Intuitive user experience

### 2. Financial Clarity
- Clear financial data presentation
- Consistent number formatting
- Visual hierarchy for important information
- Trust-building design elements

### 3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios
- Focus indicators

### 4. Responsive Design
- Mobile-first approach
- Consistent experience across devices
- Touch-friendly interactions
- Adaptive layouts

## 🎨 Color System

### Primary Colors
```css
/* Green - Success, Positive Values, Money */
--primary: 22 163 74;        /* #16a34a */
--primary-foreground: 255 255 255; /* #ffffff */

/* Blue - Trust, Stability, Information */
--secondary: 59 130 246;     /* #3b82f6 */
--secondary-foreground: 255 255 255; /* #ffffff */
```

### Semantic Colors
```css
/* Success - Positive actions, gains */
--success: 16 185 129;       /* #10b981 */
--success-foreground: 255 255 255; /* #ffffff */

/* Warning - Caution, attention needed */
--warning: 245 158 11;       /* #f59e0b */
--warning-foreground: 0 0 0; /* #000000 */

/* Error - Negative actions, losses */
--error: 239 68 68;          /* #ef4444 */
--error-foreground: 255 255 255; /* #ffffff */

/* Info - Information, neutral */
--info: 6 182 212;           /* #06b6d4 */
--info-foreground: 255 255 255; /* #ffffff */
```

### Neutral Colors
```css
/* Background colors */
--background: 255 255 255;   /* #ffffff */
--foreground: 15 23 42;      /* #0f172a */

/* Card and surface colors */
--card: 255 255 255;         /* #ffffff */
--card-foreground: 15 23 42; /* #0f172a */

/* Border and divider colors */
--border: 226 232 240;       /* #e2e8f0 */
--input: 226 232 240;        /* #e2e8f0 */

/* Muted text colors */
--muted: 241 245 249;        /* #f1f5f9 */
--muted-foreground: 100 116 139; /* #64748b */

/* Accent colors */
--accent: 241 245 249;       /* #f1f5f9 */
--accent-foreground: 15 23 42; /* #0f172a */
```

### Dark Mode Colors
```css
/* Dark mode overrides */
.dark {
  --background: 2 6 23;      /* #020617 */
  --foreground: 248 250 252; /* #f8fafc */
  --card: 15 23 42;          /* #0f172a */
  --card-foreground: 248 250 252; /* #f8fafc */
  --border: 30 41 59;        /* #1e293b */
  --input: 30 41 59;         /* #1e293b */
  --muted: 30 41 59;         /* #1e293b */
  --muted-foreground: 148 163 184; /* #94a3b8 */
  --accent: 30 41 59;        /* #1e293b */
  --accent-foreground: 248 250 252; /* #f8fafc */
}
```

## 📝 Typography

### Font Family
```css
/* Primary font - Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace font - for numbers and codes */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Font Sizes
```css
/* Headings */
--text-4xl: 2.25rem;    /* 36px - Page titles */
--text-3xl: 1.875rem;   /* 30px - Section titles */
--text-2xl: 1.5rem;     /* 24px - Card titles */
--text-xl: 1.25rem;     /* 20px - Subsection titles */
--text-lg: 1.125rem;    /* 18px - Large text */

/* Body text */
--text-base: 1rem;      /* 16px - Default body text */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Very small text */
```

### Font Weights
```css
--font-light: 300;      /* Light */
--font-normal: 400;     /* Regular */
--font-medium: 500;     /* Medium */
--font-semibold: 600;   /* Semi-bold */
--font-bold: 700;       /* Bold */
```

### Line Heights
```css
--leading-tight: 1.25;   /* Tight line height */
--leading-normal: 1.5;   /* Normal line height */
--leading-relaxed: 1.625; /* Relaxed line height */
```

## 📏 Spacing System

### Base Unit
- **Base unit**: 4px (0.25rem)
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Common Spacing
```css
/* Component spacing */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### Layout Spacing
```css
/* Page margins */
--page-margin: 1rem;      /* 16px - Mobile */
--page-margin-md: 2rem;   /* 32px - Tablet */
--page-margin-lg: 3rem;   /* 48px - Desktop */

/* Section spacing */
--section-spacing: 2rem;  /* 32px - Between sections */
--section-spacing-lg: 3rem; /* 48px - Large sections */

/* Component spacing */
--component-padding: 1rem; /* 16px - Component padding */
--component-margin: 1rem;  /* 16px - Component margin */
```

## 🧩 Component Patterns

### Button Variants
```typescript
// Primary button - Main actions
<Button variant="default" size="default">
  Primary Action
</Button>

// Secondary button - Secondary actions
<Button variant="outline" size="default">
  Secondary Action
</Button>

// Ghost button - Subtle actions
<Button variant="ghost" size="default">
  Ghost Action
</Button>

// Destructive button - Dangerous actions
<Button variant="destructive" size="default">
  Delete
</Button>
```

### Button Sizes
```typescript
// Small button
<Button size="sm">Small</Button>

// Default button
<Button size="default">Default</Button>

// Large button
<Button size="lg">Large</Button>

// Icon button
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Card Patterns
```typescript
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>

// Card with actions
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Patterns
```typescript
// Form with validation
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        {...register("email")}
      />
      {errors.email && (
        <p className="text-sm text-red-500">{errors.email.message}</p>
      )}
    </div>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  </div>
</form>
```

### Data Display Patterns
```typescript
// Financial data display
<div className="flex items-center justify-between">
  <span className="text-sm text-muted-foreground">Total Balance</span>
  <span className="text-2xl font-bold text-green-600">
    {formatCurrency(balance)}
  </span>
</div>

// Status indicators
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-green-500" />
  <span className="text-sm">Active</span>
</div>

// Progress indicators
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Progress</span>
    <span>75%</span>
  </div>
  <Progress value={75} className="h-2" />
</div>
```

## 📱 Layout Patterns

### Page Layout
```typescript
// Standard page layout
<div className="min-h-screen bg-background">
  <header className="border-b">
    {/* Header content */}
  </header>
  <main className="container mx-auto px-4 py-6">
    {/* Page content */}
  </main>
  <footer className="border-t">
    {/* Footer content */}
  </footer>
</div>
```

### Dashboard Layout
```typescript
// Dashboard grid layout
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
      <DollarSign className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
      <p className="text-xs text-muted-foreground">
        +20.1% from last month
      </p>
    </CardContent>
  </Card>
</div>
```

### Form Layout
```typescript
// Form layout with sidebar
<div className="grid gap-6 md:grid-cols-3">
  <div className="md:col-span-2">
    <Card>
      <CardHeader>
        <CardTitle>Form Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form fields */}
      </CardContent>
    </Card>
  </div>
  <div>
    <Card>
      <CardHeader>
        <CardTitle>Help</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Help content */}
      </CardContent>
    </Card>
  </div>
</div>
```

## 🎯 Financial Data Patterns

### Currency Formatting
```typescript
// Currency formatting utility
export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Usage
formatCurrency(1000000); // "Rp 1.000.000"
formatCurrency(1000000, 'USD', 'en-US'); // "$1,000,000.00"
```

### Number Formatting
```typescript
// Number formatting utility
export function formatNumber(
  number: number,
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale).format(number);
}

// Usage
formatNumber(1000000); // "1.000.000"
formatNumber(1000000, 'en-US'); // "1,000,000"
```

### Percentage Formatting
```typescript
// Percentage formatting utility
export function formatPercentage(
  value: number,
  locale: string = 'id-ID'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// Usage
formatPercentage(15.5); // "15,5%"
formatPercentage(15.5, 'en-US'); // "15.5%"
```

### Date Formatting
```typescript
// Date formatting utility
export function formatDate(
  date: Date | string,
  locale: string = 'id-ID'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

// Usage
formatDate(new Date()); // "15 Desember 2023"
formatDate(new Date(), 'en-US'); // "December 15, 2023"
```

## 🎨 Visual Patterns

### Loading States
```typescript
// Skeleton loading
<div className="space-y-3">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[150px]" />
</div>

// Spinner loading
<div className="flex items-center justify-center p-8">
  <Loader2 className="h-8 w-8 animate-spin" />
  <span className="ml-2">Loading...</span>
</div>
```

### Empty States
```typescript
// Empty state component
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 text-muted-foreground">
    <Icon className="h-full w-full" />
  </div>
  <h3 className="mt-2 text-sm font-semibold text-foreground">
    No data found
  </h3>
  <p className="mt-1 text-sm text-muted-foreground">
    Get started by creating your first item.
  </p>
  <div className="mt-6">
    <Button>Create Item</Button>
  </div>
</div>
```

### Error States
```typescript
// Error state component
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 text-red-500">
    <AlertCircle className="h-full w-full" />
  </div>
  <h3 className="mt-2 text-sm font-semibold text-foreground">
    Something went wrong
  </h3>
  <p className="mt-1 text-sm text-muted-foreground">
    {error.message}
  </p>
  <div className="mt-6">
    <Button onClick={retry}>Try again</Button>
  </div>
</div>
```

### Success States
```typescript
// Success state component
<div className="text-center py-12">
  <div className="mx-auto h-12 w-12 text-green-500">
    <CheckCircle className="h-full w-full" />
  </div>
  <h3 className="mt-2 text-sm font-semibold text-foreground">
    Success!
  </h3>
  <p className="mt-1 text-sm text-muted-foreground">
    Your action was completed successfully.
  </p>
</div>
```

## 📊 Chart and Data Visualization

### Chart Colors
```typescript
// Chart color palette
export const chartColors = [
  '#16a34a', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

// Usage in charts
const data = [
  { name: 'Category 1', value: 100, color: chartColors[0] },
  { name: 'Category 2', value: 200, color: chartColors[1] },
  // ...
];
```

### Chart Patterns
```typescript
// Responsive chart container
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#16a34a" />
    </BarChart>
  </ResponsiveContainer>
</div>
```

## 🎯 Accessibility Patterns

### Focus Management
```typescript
// Focus trap for modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <div className="fixed inset-0 z-50">
    {/* Modal content */}
  </div>
</FocusTrap>
```

### ARIA Labels
```typescript
// Proper ARIA labeling
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  <X className="h-4 w-4" />
</button>
```

### Screen Reader Support
```typescript
// Screen reader only text
<span className="sr-only">Loading data</span>

// Live region for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

## 🚀 Performance Patterns

### Lazy Loading
```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./LazyComponent'));

// Usage with Suspense
<Suspense fallback={<Skeleton />}>
  <LazyComponent />
</Suspense>
```

### Image Optimization
```typescript
// Optimized images
import Image from 'next/image';

<Image
  src="/placeholder.jpg"
  alt="Description"
  width={400}
  height={300}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Code Splitting
```typescript
// Dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

## 📱 Responsive Patterns

### Breakpoints
```css
/* Tailwind breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Responsive Grid
```typescript
// Responsive grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

### Responsive Typography
```typescript
// Responsive text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Title
</h1>
```

## 🎨 Animation Patterns

### Transitions
```css
/* Standard transitions */
.transition-standard {
  transition: all 0.2s ease-in-out;
}

.transition-fast {
  transition: all 0.1s ease-in-out;
}

.transition-slow {
  transition: all 0.3s ease-in-out;
}
```

### Hover Effects
```typescript
// Hover effects
<button className="transition-colors hover:bg-accent hover:text-accent-foreground">
  Hover me
</button>
```

### Loading Animations
```typescript
// Loading spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Pulse animation
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4"></div>
</div>
```

## 🎯 Best Practices

### 1. Consistency
- Use established patterns consistently
- Maintain visual hierarchy
- Follow naming conventions
- Use semantic colors

### 2. Performance
- Optimize images and assets
- Use lazy loading appropriately
- Minimize bundle size
- Implement proper caching

### 3. Accessibility
- Provide proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios
- Test with screen readers

### 4. Responsiveness
- Design mobile-first
- Test on various devices
- Use flexible layouts
- Optimize touch interactions

### 5. Maintainability
- Use design tokens
- Document patterns
- Keep components reusable
- Follow established conventions

---

This design system ensures consistency, accessibility, and maintainability across the Permoney application. Always refer to these patterns when implementing new features or components.
