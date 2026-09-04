"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes injects an inline <script> to prevent theme flicker (FOUC)
// during hydration. React 19 warns about script tags inside components. The
// script runs correctly during SSR, so this specific warning is a known
// false positive (github.com/pacocoursey/next-themes#387). Suppress it so the
// dev overlay stays clean while we keep rendering the script.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component") &&
      (args[1] as { componentStack?: string })?.componentStack?.includes("ThemeProvider")
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}