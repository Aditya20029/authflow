"use client"

import Link from "next/link"
import { Bell, AlertTriangle, Clock, Info, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { TONE } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

export type NotificationTone = "danger" | "warning" | "info" | "success"

export type NotificationItem = {
  id: string
  title: string
  description: string
  href: string
  tone: NotificationTone
  timestamp?: string
}

const TONE_ICON: Record<NotificationTone, typeof Bell> = {
  danger: AlertTriangle,
  warning: Clock,
  info: Info,
  success: CheckCircle2,
}

export function Notifications({ items }: { items: NotificationItem[] }) {
  const count = items.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${count ? `, ${count} active` : ""}`}
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {count > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {count} active
            </span>
          )}
        </div>
        <div className="border-t border-border" />
        {count === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium">You are all caught up</p>
            <p className="text-xs text-muted-foreground">
              At-risk requests and recent decisions will appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <ul className="py-1">
              {items.map((n) => {
                const Icon = TONE_ICON[n.tone]
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE[n.tone].text)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.description}
                        </p>
                        {n.timestamp && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                            {n.timestamp}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
        <div className="border-t border-border" />
        <Link
          href="/worklist"
          className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:underline"
        >
          View full worklist
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
