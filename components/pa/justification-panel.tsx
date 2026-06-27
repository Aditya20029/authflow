import { XCircle, Gavel } from "lucide-react"

import type { PaDetail } from "@/lib/data/pa"

export function JustificationPanel({ pa }: { pa: PaDetail }) {
  return (
    <div className="space-y-4">
      {pa.clinicalJustification ? (
        <p className="text-pretty text-sm leading-relaxed text-foreground/90">
          {pa.clinicalJustification}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No clinical justification has been written yet. Auto-fill drafts one from
          the chart.
        </p>
      )}

      {pa.denialReason && (
        <div className="flex items-start gap-2 rounded-lg border border-red-600/25 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Denial reason</p>
            <p className="text-pretty">{pa.denialReason}</p>
          </div>
        </div>
      )}

      {pa.appealStatus && (
        <div className="flex items-start gap-2 rounded-lg border border-purple-600/25 bg-purple-50 p-3 text-sm text-purple-700 dark:bg-purple-400/10 dark:text-purple-300">
          <Gavel className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Appeal in progress</p>
            <p className="text-pretty">Appeal {pa.appealStatus.toLowerCase()}.</p>
          </div>
        </div>
      )}
    </div>
  )
}
