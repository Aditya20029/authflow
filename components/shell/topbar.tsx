"use client"

import * as React from "react"
import Link from "next/link"
import { Search, LifeBuoy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileNav } from "@/components/shell/mobile-nav"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import {
  Notifications,
  type NotificationItem,
} from "@/components/shell/notifications"
import { useCommandMenu } from "@/components/shell/command-menu"

function SearchTrigger() {
  const { setOpen } = useCommandMenu()
  const [isMac, setIsMac] = React.useState(true)
  React.useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform))
  }, [])

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group inline-flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-soft transition-colors hover:border-ring/40 hover:text-foreground"
      aria-label="Open command palette to search"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search requests or patients</span>
      <span className="sm:hidden">Search</span>
      <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  )
}

export function Topbar({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <MobileNav />
      <div className="flex flex-1 items-center">
        <SearchTrigger />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="hidden sm:inline-flex"
        >
          <Link href="/settings" aria-label="Help and resources">
            <LifeBuoy className="h-[1.15rem] w-[1.15rem]" />
          </Link>
        </Button>
        <Notifications items={notifications} />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 rounded-full focus-visible:ring-2"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  AR
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-semibold">Dr. Alex Rivera</span>
              <span className="text-xs font-normal text-muted-foreground">
                PA Coordinator
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Practice settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/analytics">My analytics</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
