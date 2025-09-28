import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <SignIn
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
        redirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
