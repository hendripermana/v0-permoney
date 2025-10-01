"use client"

import { UserProfile } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Bell, Palette, Globe, CreditCard } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, preferences, and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile & Account Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile & Account</CardTitle>
              <CardDescription>
                Manage your personal information, email, password, and account settings.
                Changes are powered by Clerk and synced across all devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-background p-2">
                <UserProfile
                  appearance={{
                    variables: {
                      colorPrimary: "#16a34a",
                      borderRadius: "0.5rem",
                      fontFamily: "inherit",
                    },
                    elements: {
                      card: "bg-background border-0 shadow-none",
                      formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
                      headerTitle: "text-foreground",
                      headerSubtitle: "text-muted-foreground",
                      formFieldInput: "bg-background border-input text-foreground focus:border-green-500 focus:ring-green-500",
                      footerActionLink: "text-green-600 hover:text-green-700",
                      navbar: "hidden", // Hide duplicate navbar
                    },
                  }}
                  routing="hash"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Permoney looks and feels. Choose your preferred theme and display options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme or sync with system settings
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Color Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Choose Light, Dark, or System theme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Display</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your display preferences (Coming Soon)
                  </p>
                </div>
                <div className="rounded-lg border p-4 space-y-3 opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Show more content in less space
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Font Size</p>
                      <p className="text-sm text-muted-foreground">
                        Adjust text size for better readability
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your security settings, two-factor authentication, and active sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Security settings are managed through your Clerk account. Switch to the Profile tab to access security options.
              </p>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      View and manage devices where you're signed in
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your password or enable passwordless sign-in
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how and when you want to be notified about important updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your transactions and budgets
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Budget Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you're approaching budget limits
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly financial summary via email
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your currency, language, timezone, and regional settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <p className="font-medium">Currency</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your preferred currency: <span className="font-medium text-foreground">IDR (Indonesian Rupiah)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Set during onboarding. Future updates will allow changing this here.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Interface language: <span className="font-medium text-foreground">English</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Multi-language support coming soon
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium">Timezone</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your timezone: <span className="font-medium text-foreground">Asia/Jakarta (WIB)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on your country setting
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-lg">Free Plan</p>
                  <p className="text-sm text-muted-foreground">
                    You're currently on the free plan with full access to all features
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Premium plans and billing features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
