"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const PUBLIC_ROUTES = new Set(["/", "/login", "/register", "/forgot-password"])

interface ProtectedAppLayoutProps {
  children: ReactNode
}

export function ProtectedAppLayout({ children }: ProtectedAppLayoutProps) {
  const pathname = usePathname()

  const isPublicRoute = useMemo(() => {
    if (!pathname) return false
    if (PUBLIC_ROUTES.has(pathname)) return true
    return pathname.startsWith("/auth/")
  }, [pathname])

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <h1 className="font-semibold">Personal Finance Management</h1>
              </div>
            </header>
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}

