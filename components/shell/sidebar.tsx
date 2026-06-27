"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { PRIMARY_NAV, isActivePath } from "@/lib/nav"
import { Logo } from "@/components/brand/logo"

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Workspace
      </p>
      {PRIMARY_NAV.map((item) => {
        const active = isActivePath(pathname, item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                active ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function ComplianceCard() {
  return (
    <div className="mx-3 mb-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Demonstration prototype
      </div>
      <p className="mt-1 text-pretty text-[11px] leading-relaxed text-muted-foreground">
        Synthetic data only. Not a medical device and not HIPAA covered.
      </p>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="rounded-md focus-visible:ring-2">
          <Logo />
        </Link>
      </div>
      <SidebarNav />
      <div className="mt-auto">
        <ComplianceCard />
      </div>
    </aside>
  )
}
