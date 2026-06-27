import { cn } from "@/lib/utils"
import { statusMeta } from "@/lib/status"

export function StatusPill({
  status,
  className,
  withDot = true,
}: {
  status: string
  className?: string
  withDot?: boolean
}) {
  const meta = statusMeta(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.pill,
        className,
      )}
    >
      {withDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      )}
      {meta.label}
    </span>
  )
}
