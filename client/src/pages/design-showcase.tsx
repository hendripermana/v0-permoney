import React, { useState } from 'react';
import {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardTitle,
  PermoneyCardDescription,
  PermoneyCardContent,
  PermoneyCardFooter,
  PermoneyButton,
  PermoneyInput,
} from '@/components';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  User,
  Mail,
  Lock,
  Search,
  Bell,
  Settings,
  ArrowRight,
  Plus,
  Download,
} from 'lucide-react';

export function DesignShowcase() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">
          Permoney Design System
        </h1>
        <p className="text-muted-foreground text-lg">
          Enhanced components with glassmorphism and modern UX
        </p>
      </div>

      {/* Card Variants Showcase */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          PermoneyCard Variants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Card */}
          <PermoneyCard className="slide-up">
            <PermoneyCardHeader>
              <PermoneyCardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-neon-green" />
                Default Card
              </PermoneyCardTitle>
              <PermoneyCardDescription>
                Standard glassmorphism with signature shadows
              </PermoneyCardDescription>
            </PermoneyCardHeader>
            <PermoneyCardContent>
              <div className="text-2xl font-bold text-neon-green">$12,450</div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
            </PermoneyCardContent>
          </PermoneyCard>

          {/* Green Variant */}
          <PermoneyCard variant="green" className="slide-up stagger-1">
            <PermoneyCardHeader>
              <PermoneyCardTitle className="flex items-center gap-2 text-black">
                <TrendingUp className="h-5 w-5" />
                Green Variant
              </PermoneyCardTitle>
              <PermoneyCardDescription className="text-black/70">
                Signature neon green with black shadows
              </PermoneyCardDescription>
            </PermoneyCardHeader>
            <PermoneyCardContent>
              <div className="text-2xl font-bold text-black">+24.5%</div>
              <p className="text-sm text-black/70">Monthly Growth</p>
            </PermoneyCardContent>
          </PermoneyCard>

          {/* Elevated Variant */}
          <PermoneyCard variant="elevated" className="slide-up stagger-2">
            <PermoneyCardHeader>
              <PermoneyCardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-neon-green" />
                Elevated Card
              </PermoneyCardTitle>
              <PermoneyCardDescription>
                Enhanced borders and shadows for emphasis
              </PermoneyCardDescription>
            </PermoneyCardHeader>
            <PermoneyCardContent>
              <div className="text-2xl font-bold text-foreground">3</div>
              <p className="text-sm text-muted-foreground">Active Cards</p>
            </PermoneyCardContent>
          </PermoneyCard>
        </div>
      </section>

      {/* Button Variants Showcase */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          PermoneyButton Variants
        </h2>

        <PermoneyCard className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PermoneyButton variant="default">Default</PermoneyButton>

            <PermoneyButton variant="glass">Glass</PermoneyButton>

            <PermoneyButton variant="outline">Outline</PermoneyButton>

            <PermoneyButton variant="neon">Neon</PermoneyButton>

            <PermoneyButton variant="gradient">Gradient</PermoneyButton>

            <PermoneyButton variant="ghost">Ghost</PermoneyButton>

            <PermoneyButton variant="secondary">Secondary</PermoneyButton>

            <PermoneyButton variant="destructive">Destructive</PermoneyButton>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Button Sizes & States</h3>
            <div className="flex flex-wrap items-center gap-4">
              <PermoneyButton size="sm" leftIcon={<Plus className="h-3 w-3" />}>
                Small
              </PermoneyButton>

              <PermoneyButton
                size="default"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Default
              </PermoneyButton>

              <PermoneyButton
                size="lg"
                leftIcon={<Download className="h-5 w-5" />}
              >
                Large
              </PermoneyButton>

              <PermoneyButton
                variant="neon"
                loading={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Processing...' : 'Submit'}
              </PermoneyButton>
            </div>
          </div>
        </PermoneyCard>
      </section>

      {/* Input Variants Showcase */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          PermoneyInput Variants
        </h2>

        <PermoneyCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PermoneyInput
              variant="default"
              label="Email Address"
              placeholder="Enter your email"
              leftIcon={<Mail className="h-4 w-4" />}
              helperText="We'll never share your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <PermoneyInput
              variant="glass"
              label="Password"
              type="password"
              placeholder="Enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <PermoneyInput
              variant="neon"
              label="Search"
              placeholder="Search transactions..."
              leftIcon={<Search className="h-4 w-4" />}
              rightIcon={<Bell className="h-4 w-4" />}
            />

            <PermoneyInput
              variant="minimal"
              label="Amount"
              placeholder="0.00"
              leftIcon={<DollarSign className="h-4 w-4" />}
            />

            <PermoneyInput
              variant="solid"
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User className="h-4 w-4" />}
              state="success"
              helperText="Name verified successfully"
            />

            <PermoneyInput
              variant="default"
              label="Phone Number"
              placeholder="+62 812 3456 7890"
              state="error"
              errorMessage="Please enter a valid phone number"
            />
          </div>
        </PermoneyCard>
      </section>

      {/* Interactive Demo */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Interactive Demo
        </h2>

        <PermoneyCard
          variant="elevated"
          size="lg"
          interactive
          className="cursor-pointer"
        >
          <PermoneyCardHeader>
            <PermoneyCardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-neon-green" />
                Dashboard Settings
              </span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </PermoneyCardTitle>
            <PermoneyCardDescription>
              Click to configure your dashboard preferences
            </PermoneyCardDescription>
          </PermoneyCardHeader>
          <PermoneyCardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last updated</p>
                <p className="font-medium">2 hours ago</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-neon-green">Active</p>
              </div>
            </div>
          </PermoneyCardContent>
          <PermoneyCardFooter>
            <PermoneyButton variant="glass" size="sm" className="ml-auto">
              Configure
            </PermoneyButton>
          </PermoneyCardFooter>
        </PermoneyCard>
      </section>

      {/* Loading State Demo */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Loading States
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PermoneyCard loading>
            {/* Loading skeleton will be rendered */}
          </PermoneyCard>
          <PermoneyCard loading>
            {/* Loading skeleton will be rendered */}
          </PermoneyCard>
          <PermoneyCard loading>
            {/* Loading skeleton will be rendered */}
          </PermoneyCard>
        </div>
      </section>
    </div>
  );
}
