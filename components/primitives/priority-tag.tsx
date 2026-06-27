import { cn } from "@/lib/utils"
import { priorityMeta } from "@/lib/status"

export function PriorityTag({
  priority,
  className,
}: {
  priority: string
  className?: string
}) {
  const meta = priorityMeta(priority)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        meta.pill,
        className,
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}
