import Link from "next/link"
import { Activity } from "lucide-react"

import { cn } from "@/lib/utils"
import { statusMeta } from "@/lib/status"
import { EmptyState } from "@/components/primitives/empty-state"
import type { ActivityItem } from "@/lib/data/dashboard"

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Status changes across the practice will appear here as requests move."
      />
    )
  }
  return (
    <ul className="-mx-2">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            href={`/pa/${a.paId}`}
            className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                statusMeta(a.toStatus).dot,
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium text-foreground">{a.referenceId}</span>{" "}
                <span className="text-muted-foreground">{a.patientName}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {a.note ?? `Moved to ${statusMeta(a.toStatus).label}`}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {a.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
