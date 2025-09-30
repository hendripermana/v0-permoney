import type { ReactNode } from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import { ClerkProvider } from "@clerk/nextjs"

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
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/onboarding"
      afterSignUpUrl="/onboarding"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#16a34a",
          colorBackground: "hsl(var(--background))",
          colorInputBackground: "hsl(var(--background))",
          colorInputText: "hsl(var(--foreground))",
          colorText: "hsl(var(--foreground))",
          colorTextSecondary: "hsl(var(--muted-foreground))",
          borderRadius: "0.5rem",
          fontFamily: "inherit",
        },
        elements: {
          formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
          card: "bg-background border shadow-sm",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "border-input hover:bg-accent",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground bg-background",
          formFieldLabel: "text-foreground",
          formFieldInput: "bg-background border-input text-foreground focus:border-green-500 focus:ring-green-500",
          footerActionText: "text-muted-foreground",
          footerActionLink: "text-green-600 hover:text-green-700",
          alert: "bg-destructive/10 border-destructive/20 text-destructive",
          alertText: "text-destructive",
        },
      }}
    >
      <html lang="en">
        <body className="min-h-screen bg-background font-sans antialiased">
          <ErrorBoundary>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
