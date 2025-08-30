"use client"

import Link from "next/link"
import { ArrowRight, Smartphone, Palette, Zap, Shield, Globe, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-green-500 flex items-center justify-center mr-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="text-green-500">Permoney</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive personal finance management for Indonesian households with multi-user support,
              multi-currency operations, and Islamic finance compliance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-green-500 hover:bg-green-600">
              <Link href="/dashboard">
                Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/transactions">View Transactions</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/budgets">Manage Budgets</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <Smartphone className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Mobile-First PWA</CardTitle>
              <CardDescription>
                Progressive Web App with offline capabilities and mobile-optimized design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Responsive breakpoints</li>
                <li>• Touch-friendly interactions</li>
                <li>• PWA manifest configured</li>
                <li>• Safe area support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <Palette className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Indonesian Localization</CardTitle>
              <CardDescription>
                Built specifically for Indonesian households with proper currency and locale support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• IDR currency formatting</li>
                <li>• Indonesian number format</li>
                <li>• Islamic finance compliance</li>
                <li>• Multi-user households</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <Zap className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Smart Analytics</CardTitle>
              <CardDescription>Advanced financial analytics with spending insights and budget tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Spending categorization</li>
                <li>• Budget vs actual analysis</li>
                <li>• Financial goal tracking</li>
                <li>• Expense predictions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Bank-Grade Security</CardTitle>
              <CardDescription>Enterprise-level security with encryption and secure authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• End-to-end encryption</li>
                <li>• Multi-factor authentication</li>
                <li>• Secure API endpoints</li>
                <li>• Privacy controls</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardHeader>
              <Globe className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Multi-Currency Support</CardTitle>
              <CardDescription>Handle multiple currencies with real-time exchange rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Real-time exchange rates</li>
                <li>• Currency conversion</li>
                <li>• Multi-currency accounts</li>
                <li>• International transactions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-green-500 text-white border-green-500">
            <CardHeader>
              <CardTitle>Ready to Start</CardTitle>
              <CardDescription className="text-green-100">
                All features are set up and ready for your financial management needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                variant="outline"
                className="w-full border-white text-green-500 bg-white hover:bg-green-50"
              >
                <Link href="/dashboard">Get Started Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="text-center space-y-8 py-12">
          <h2 className="text-3xl font-bold">Built with Modern Technologies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-500">Next.js 15</div>
              <div className="text-sm text-muted-foreground">App Router & RSC</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-500">shadcn/ui</div>
              <div className="text-sm text-muted-foreground">Component Library</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-500">Tailwind CSS</div>
              <div className="text-sm text-muted-foreground">Utility-First CSS</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-500">NestJS API</div>
              <div className="text-sm text-muted-foreground">Backend Services</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
