import { Pill } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { PaDetail } from "@/lib/data/pa"

export function MedicationCard({ pa }: { pa: PaDetail }) {
  const m = pa.medication
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Pill className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold text-foreground">
            {m.name}
          </span>
          {m.brandName && (
            <span className="text-sm text-muted-foreground">{m.brandName}</span>
          )}
          {m.isSpecialty && <Badge variant="secondary">Specialty</Badge>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {m.drugClass}
          {m.route ? ` · ${m.route}` : ""}
        </p>
        <p className="mt-1 text-sm text-foreground">{m.indication}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Diagnosis{" "}
          <span className="font-code text-foreground">{pa.diagnosisCode}</span>{" "}
          {pa.diagnosisLabel}
        </p>
      </div>
      <div className="shrink-0 space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-xs">
        <CodeRow label="NDC" value={m.ndc} />
        {m.hcpcs && <CodeRow label="HCPCS" value={m.hcpcs} />}
        {m.cpt && <CodeRow label="CPT" value={m.cpt} />}
      </div>
    </div>
  )
}

function CodeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-code text-foreground">{value}</span>
    </div>
  )
}
