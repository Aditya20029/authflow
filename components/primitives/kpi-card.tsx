import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Trend } from "@/lib/data/dashboard"

const TONE_ICON: Record<string, string> = {
  brand: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
  tone?: "brand" | "warning" | "danger" | "success"
}) {
  return (
    <Card className="shadow-card transition-shadow hover:shadow-lift">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              TONE_ICON[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          {trend && <TrendBadge trend={trend} />}
          {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
