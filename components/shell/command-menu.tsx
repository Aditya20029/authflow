"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  User,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react"

import { PRIMARY_NAV } from "@/lib/nav"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export type CommandSearchItem = {
  id: string
  type: "request" | "patient"
  title: string
  subtitle?: string
  href: string
  keywords?: string[]
}

type CommandMenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandMenuContext = React.createContext<CommandMenuContextValue | null>(
  null,
)

export function useCommandMenu() {
  const ctx = React.useContext(CommandMenuContext)
  if (!ctx) throw new Error("useCommandMenu must be used within CommandMenuProvider")
  return ctx
}

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/": LayoutDashboard,
  "/worklist": ListChecks,
  "/new": PlusCircle,
  "/payers": Building2,
  "/analytics": BarChart3,
  "/settings": Settings,
}

export function CommandMenuProvider({
  children,
  searchItems = [],
}: {
  children: React.ReactNode
  searchItems?: CommandSearchItem[]
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const go = React.useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const requests = searchItems.filter((i) => i.type === "request")
  const patients = searchItems.filter((i) => i.type === "patient")

  return (
    <CommandMenuContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search requests, patients, or jump to a page..." />
        <CommandList>
          <CommandEmpty>No matches. Try a patient name, medication, or PA ID.</CommandEmpty>

          <CommandGroup heading="Go to">
            {PRIMARY_NAV.map((item) => {
              const Icon = NAV_ICONS[item.href] ?? FileText
              return (
                <CommandItem
                  key={item.href}
                  value={`page ${item.label} ${item.description}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>

          {requests.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Requests">
                {requests.slice(0, 8).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`request ${item.title} ${item.subtitle ?? ""} ${(item.keywords ?? []).join(" ")}`}
                    onSelect={() => go(item.href)}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {patients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Patients">
                {patients.slice(0, 6).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`patient ${item.title} ${item.subtitle ?? ""} ${(item.keywords ?? []).join(" ")}`}
                    onSelect={() => go(item.href)}
                  >
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </CommandMenuContext.Provider>
  )
}
