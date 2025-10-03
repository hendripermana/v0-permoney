"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { OnboardingCheck } from "@/components/onboarding-check"
import { AppBreadcrumb } from "@/components/app-breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingCheck>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="-ml-1" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <h1 className="font-semibold text-foreground">Personal Finance Management</h1>
                <div className="flex items-center gap-2">
                  <AppBreadcrumb />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="flex-1">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </OnboardingCheck>
  )
}
