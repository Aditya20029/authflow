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

  // Routine is the common case across the worklist. Render it as quiet text so
  // the eye lands on the Urgent and STAT exceptions, which keep the pill.
  if (priority === "Routine") {
    return (
      <span
        className={cn(
          "inline-flex items-center whitespace-nowrap text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        {meta.label}
      </span>
    )
  }

  // Share the StatusPill geometry so the two columns speak one pill language.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}
