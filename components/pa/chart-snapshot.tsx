import { cn } from "@/lib/utils"
import type { PatientChart, TherapyOutcome, LabFlag } from "@/types"

const OUTCOME_STYLE: Record<TherapyOutcome, string> = {
  failed: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
  intolerant:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
  partial:
    "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  ongoing:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
}

function flagClass(flag?: LabFlag): string {
  if (flag === "critical" || flag === "high")
    return "text-amber-700 dark:text-amber-400"
  if (flag === "low") return "text-blue-700 dark:text-blue-400"
  return "text-foreground"
}

function Block({
  title,
  empty,
  children,
  show,
}: {
  title: string
  empty: string
  children: React.ReactNode
  show: boolean
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        {title}
      </p>
      {show ? children : <p className="text-sm text-muted-foreground">{empty}</p>}
    </div>
  )
}

export function ChartSnapshot({ chart }: { chart: PatientChart }) {
  return (
    <div className="space-y-4">
      <Block
        title="Diagnoses"
        empty="No diagnoses on file"
        show={chart.diagnoses.length > 0}
      >
        <ul className="space-y-1">
          {chart.diagnoses.map((d, i) => (
            <li key={i} className="text-sm">
              <span className="font-code text-xs text-muted-foreground">
                {d.code}
              </span>{" "}
              {d.label}
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title="Prior therapies"
        empty="No prior therapies recorded"
        show={chart.priorTherapies.length > 0}
      >
        <ul className="space-y-1.5">
          {chart.priorTherapies.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="min-w-0 text-sm">
                {t.name}{" "}
                <span className="text-xs text-muted-foreground">{t.drugClass}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset",
                  OUTCOME_STYLE[t.outcome],
                )}
              >
                {t.outcome}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title="Recent labs"
        empty="No recent labs"
        show={chart.labs.length > 0}
      >
        <ul className="space-y-1">
          {chart.labs.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{l.name}</span>
              <span className={cn("shrink-0 font-code text-xs", flagClass(l.flag))}>
                {l.value}
                {l.unit ? ` ${l.unit}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  )
}
