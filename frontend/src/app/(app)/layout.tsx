"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { OnboardingCheck } from "@/components/onboarding-check"
import { AppBreadcrumb } from "@/components/app-breadcrumb"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingCheck>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <h1 className="font-semibold">Personal Finance Management</h1>
                <AppBreadcrumb />
              </div>
            </header>
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </OnboardingCheck>
  )
}
