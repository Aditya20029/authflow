import { AlertTriangle, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { TONE } from "@/lib/status"
import type { DeadlineState } from "@/lib/deadline"

const base =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"

export function DeadlineBadge({
  state,
  label,
  className,
}: {
  state: DeadlineState
  label: string
  className?: string
}) {
  if (state === "overdue") {
    return (
      <span className={cn(base, TONE.danger.pill, className)}>
        <AlertTriangle className="h-3 w-3" />
        {label}
      </span>
    )
  }
  if (state === "atRisk") {
    return (
      <span className={cn(base, TONE.warning.pill, className)}>
        <Clock className="h-3 w-3" />
        {label}
      </span>
    )
  }
  return (
    <span className={cn("whitespace-nowrap text-xs text-muted-foreground", className)}>
      {label}
    </span>
  )
}
