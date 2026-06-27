import {
  CheckCircle2,
  CircleAlert,
  FileText,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { TONE } from "@/lib/status"
import { Progress } from "@/components/ui/progress"
import type { PaDocument } from "@/lib/data/pa"

const SOURCE: Record<string, { label: string; icon: LucideIcon }> = {
  Chart: { label: "From chart", icon: FileText },
  Lab: { label: "From labs", icon: FlaskConical },
  Provider: { label: "From provider", icon: Stethoscope },
  Manual: { label: "Manual", icon: ClipboardList },
}

export function DocumentsChecklist({ documents }: { documents: PaDocument[] }) {
  const total = documents.length
  const satisfied = documents.filter((d) => d.satisfied).length
  const missing = total - satisfied
  const pct = total === 0 ? 0 : Math.round((satisfied / total) * 100)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            <span className="tabular-nums">{satisfied}</span> of{" "}
            <span className="tabular-nums">{total}</span> requirements satisfied
          </span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {documents.map((doc) => {
          const src = SOURCE[doc.source] ?? SOURCE.Manual
          const SrcIcon = src.icon
          return (
            <li key={doc.id} className="flex gap-3 p-3.5">
              {doc.satisfied ? (
                <CheckCircle2 className={cn("mt-0.5 h-5 w-5 shrink-0", TONE.success.text)} />
              ) : (
                <CircleAlert className={cn("mt-0.5 h-5 w-5 shrink-0", TONE.warning.text)} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-foreground">
                    {doc.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <SrcIcon className="h-3 w-3" />
                    {src.label}
                  </span>
                </div>
                {doc.satisfied ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {doc.evidence ?? "Satisfied"}
                  </p>
                ) : (
                  <p className={cn("mt-0.5 text-sm", TONE.warning.text)}>
                    Not found in the chart. Capture this before the patient leaves.
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {missing > 0 ? (
        <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", TONE.warning.soft)}>
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium tabular-nums">{missing}</span>{" "}
            {missing === 1 ? "item" : "items"} still needed before this request can
            be submitted. Auto-fill pulls everything available from the chart.
          </p>
        </div>
      ) : (
        <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", TONE.brand.soft)}>
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>All required documentation is satisfied. This request is ready to submit.</p>
        </div>
      )}
    </div>
  )
}
