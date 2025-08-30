'use client';

import Link from 'next/link';
import { ArrowRight, Smartphone, Palette, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardContent, DashboardGrid } from '@/components/layout/dashboard-layout';

export default function HomePage() {
  return (
    <DashboardContent>
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="text-neon-green">Permoney</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modern frontend foundation with Next.js 15.4, shadcn/ui, Tailwind CSS, 
            and comprehensive design system for Indonesian households.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="permoney" size="lg">
            <Link href="/dashboard">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/ux-demo">
              UX Features Demo
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/design-system">
              View Design System
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <DashboardGrid columns={3}>
        <Card className="permoney-card fade-in stagger-1">
          <CardHeader>
            <Smartphone className="h-8 w-8 text-neon-green mb-2" />
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

        <Card className="permoney-card fade-in stagger-2">
          <CardHeader>
            <Palette className="h-8 w-8 text-neon-green mb-2" />
            <CardTitle>Design System</CardTitle>
            <CardDescription>
              Comprehensive design system with shadcn/ui and custom Permoney components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Light/Dark theme support</li>
              <li>• Permoney card variants</li>
              <li>• Consistent spacing</li>
              <li>• Accessible components</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="permoney-card fade-in stagger-3">
          <CardHeader>
            <Zap className="h-8 w-8 text-neon-green mb-2" />
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Optimized for speed with Next.js 15.4 and modern build tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• App Router architecture</li>
              <li>• Image optimization</li>
              <li>• Bundle optimization</li>
              <li>• React Query caching</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="permoney-card fade-in stagger-4">
          <CardHeader>
            <Shield className="h-8 w-8 text-neon-green mb-2" />
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Built-in security headers and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• CSP headers</li>
              <li>• XSS protection</li>
              <li>• HTTPS enforcement</li>
              <li>• Secure defaults</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="permoney-card fade-in stagger-5">
          <CardHeader>
            <Globe className="h-8 w-8 text-neon-green mb-2" />
            <CardTitle>Internationalization</CardTitle>
            <CardDescription>
              Indonesian locale support with proper formatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• IDR currency formatting</li>
              <li>• Indonesian number format</li>
              <li>• RTL support ready</li>
              <li>• Locale-aware dates</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="permoney-card-green fade-in stagger-6">
          <CardHeader>
            <CardTitle className="text-black">Ready to Build</CardTitle>
            <CardDescription className="text-black/70">
              All foundation components are set up and ready for development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-black text-black hover:bg-black hover:text-neon-green">
              <Link href="/dashboard">
                Start Building
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardGrid>

      {/* Tech Stack */}
      <div className="mt-16 text-center space-y-8">
        <h2 className="text-3xl font-bold">Built with Modern Technologies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neon-green">Next.js 15.4</div>
            <div className="text-sm text-muted-foreground">App Router & RSC</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neon-green">shadcn/ui</div>
            <div className="text-sm text-muted-foreground">Component Library</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neon-green">Tailwind CSS</div>
            <div className="text-sm text-muted-foreground">Utility-First CSS</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-neon-green">React Query</div>
            <div className="text-sm text-muted-foreground">Data Fetching</div>
          </div>
        </div>
      </div>
    </DashboardContent>
  );
}
