import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Practice-wide prior authorization overview",
  },
  {
    label: "Worklist",
    href: "/worklist",
    icon: ListChecks,
    description: "Every prior authorization, filterable and sortable",
  },
  {
    label: "New request",
    href: "/new",
    icon: PlusCircle,
    description: "Start a prior authorization at the point of care",
  },
  {
    label: "Payers",
    href: "/payers",
    icon: Building2,
    description: "Plans and their prior authorization criteria",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Turnaround, denials, and bottleneck trends",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Practice profile and integrations",
  },
]

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}
