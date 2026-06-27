import { ShieldAlert, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { TONE } from "@/lib/status"
import type { PaDetail } from "@/lib/data/pa"

export function CoveragePanel({ pa }: { pa: PaDetail }) {
  const { coverage } = pa
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          coverage.required ? TONE.warning.pill : TONE.success.pill,
        )}
      >
        {coverage.required ? (
          <ShieldAlert className="h-3.5 w-3.5" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
        {coverage.required
          ? "Prior authorization required"
          : "No prior authorization required"}
      </div>

      <ul className="space-y-2">
        {coverage.reasons.map((reason, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <span className="text-pretty text-foreground/90">{reason}</span>
          </li>
        ))}
      </ul>

      {coverage.required && coverage.summary && (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plan criteria
          </p>
          <p className="mt-1 text-pretty text-sm text-foreground/90">
            {coverage.summary}
          </p>
        </div>
      )}
    </div>
  )
}
