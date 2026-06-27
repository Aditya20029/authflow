"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/brand/logo"
import { SidebarNav, ComplianceCard } from "@/components/shell/sidebar"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center px-5">
          <Link href="/" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <div className="mt-auto pb-2">
          <ComplianceCard />
        </div>
      </SheetContent>
    </Sheet>
  )
}
