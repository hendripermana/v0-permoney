import type { ReactNode } from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ProtectedAppLayout } from "@/components/layout/protected-app-layout"
import { AuthProvider } from "@/hooks/use-auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Permoney - Personal Finance Intelligence",
  description:
    "Comprehensive personal finance management for Indonesian households with multi-user support, multi-currency operations, and Islamic finance compliance.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <ProtectedAppLayout>{children}</ProtectedAppLayout>
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
