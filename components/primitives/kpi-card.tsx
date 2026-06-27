import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Trend } from "@/lib/data/dashboard"

type KpiTone = "brand" | "warning" | "danger" | "success"

const TONE_STYLES: Record<KpiTone, { chip: string; glow: string }> = {
  brand: {
    chip: "bg-gradient-to-br from-teal-500/20 to-teal-500/[0.04] text-teal-600 ring-teal-500/25 dark:text-teal-300",
    glow: "bg-teal-500/15",
  },
  success: {
    chip: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/[0.04] text-emerald-600 ring-emerald-500/25 dark:text-emerald-300",
    glow: "bg-emerald-500/15",
  },
  warning: {
    chip: "bg-gradient-to-br from-amber-500/20 to-amber-500/[0.04] text-amber-600 ring-amber-500/25 dark:text-amber-300",
    glow: "bg-amber-500/15",
  },
  danger: {
    chip: "bg-gradient-to-br from-red-500/20 to-red-500/[0.04] text-red-600 ring-red-500/25 dark:text-red-300",
    glow: "bg-red-500/15",
  },
}

function TrendBadge({ trend }: { trend: Trend }) {
  const Icon =
    trend.direction === "up"
      ? ArrowUpRight
      : trend.direction === "down"
        ? ArrowDownRight
        : Minus
  const toneClass =
    trend.tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.tone === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", toneClass)}>
      <Icon className="h-3.5 w-3.5" />
      {trend.delta}
    </span>
  )
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  sublabel,
  tone = "brand",
}: {
  label: string
  value: string
  icon: LucideIcon
  trend?: Trend
  sublabel?: string
  tone?: KpiTone
}) {
  const t = TONE_STYLES[tone]
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <span
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-200 group-hover:opacity-100 opacity-70",
          t.glow,
        )}
        aria-hidden
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="min-h-[2.5rem] text-sm font-medium leading-tight text-muted-foreground line-clamp-2">
            {label}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset shadow-sm",
              t.chip,
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="mt-3.5 font-display text-[2rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          {trend && <TrendBadge trend={trend} />}
          {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
