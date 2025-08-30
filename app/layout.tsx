import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/protected-route"

export const metadata: Metadata = {
  title: "Permoney - Personal Finance Intelligence",
  description:
    "Comprehensive personal finance management for Indonesian households with multi-user support, multi-currency operations, and Islamic finance compliance.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}

function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  // Check if current path is auth-related
  const isAuthPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/register" ||
      window.location.pathname === "/forgot-password")

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Personal Finance Management</h1>
            </div>
          </header>
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</div>
        </main>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
