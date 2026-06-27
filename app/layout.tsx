import type { Metadata } from "next"
import { Inter, Sora, JetBrains_Mono } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/shell/app-shell"
import { getShellData } from "@/lib/data/shell"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: {
    default: "AuthFlow, Prior Authorization Automation",
    template: "%s · AuthFlow",
  },
  description:
    "Detect, prepare, and submit prior authorizations at the point of care. A Da Vinci CRD, DTR, and PAS workflow built on synthetic data.",
  applicationName: "AuthFlow",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { notifications, searchItems } = await getShellData()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <AppShell notifications={notifications} searchItems={searchItems}>
              {children}
            </AppShell>
          </TooltipProvider>
          <Toaster position="top-right" closeButton richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
