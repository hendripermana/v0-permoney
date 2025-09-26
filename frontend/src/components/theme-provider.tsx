"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  isMounted: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
}: ThemeProviderProps) {
  const isBrowser = typeof window !== "undefined"
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("light")
  const [isMounted, setIsMounted] = React.useState(false)

  // Hydrate from storage once we are on the client
  React.useEffect(() => {
    if (!isBrowser) return

    const storedTheme = window.localStorage.getItem(storageKey) as Theme | null
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      setThemeState(storedTheme)
    } else {
      setThemeState(defaultTheme)
    }

    setIsMounted(true)
  }, [defaultTheme, isBrowser, storageKey])

  // Track system preference when enabled
  React.useEffect(() => {
    if (!isBrowser || !enableSystem) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(event.matches ? "dark" : "light")
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [enableSystem, isBrowser])

  const resolvedTheme = theme === "system" ? systemTheme : theme

  // Apply theme class to <html> element and persist preference
  React.useEffect(() => {
    if (!isBrowser || !isMounted) return

    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    root.dataset.theme = resolvedTheme

    if (theme === "system") {
      window.localStorage.removeItem(storageKey)
    } else {
      window.localStorage.setItem(storageKey, theme)
    }
  }, [isBrowser, isMounted, resolvedTheme, storageKey, theme])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      if (current === "system") {
        return systemTheme === "dark" ? "light" : "dark"
      }
      return current === "dark" ? "light" : "dark"
    })
  }, [systemTheme])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, isMounted, setTheme, toggleTheme }),
    [isMounted, resolvedTheme, setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
