import {
  FileText,
  Percent,
  Timer,
  ClipboardList,
  Hourglass,
  XCircle,
  Sparkles,
} from "lucide-react"

import { getAnalyticsData } from "@/lib/data/analytics"
import { getAssistantMetrics } from "@/lib/data/assistant"
import { TONE, type Tone } from "@/lib/status"
import { cn } from "@/lib/utils"
import { formatHours, formatPercent } from "@/lib/format"
import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { SectionCard } from "@/components/primitives/section-card"
import { KpiCard } from "@/components/primitives/kpi-card"
import { EmptyState } from "@/components/primitives/empty-state"
import {
  DistributionBarChart,
  HorizontalBarChart,
} from "@/components/charts/analytics-charts"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const [data, assistant] = await Promise.all([
    getAnalyticsData(),
    getAssistantMetrics(),
  ])
  const k = data.kpis
  const maxReason = data.denialReasons[0]?.value ?? 0

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Turnaround, denial drivers, drug volume, and where requests sit."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total requests" value={String(k.total)} icon={FileText} sublabel={`${k.decided} decided`} />
        <KpiCard label="Approval rate" value={formatPercent(k.approvalRate)} icon={Percent} tone="success" sublabel="approved vs denied" />
        <KpiCard label="Median turnaround" value={formatHours(k.medianTurnaround)} icon={Timer} sublabel="submit to decision" />
        <KpiCard label="Avg prep time" value={formatHours(k.avgPrepHours)} icon={ClipboardList} sublabel="order to submit" />
        <KpiCard label="Avg payer review" value={formatHours(k.avgReviewHours)} icon={Hourglass} sublabel="submit to decision" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Turnaround distribution"
          description="Decided requests grouped by time from submission to decision."
        >
          <DistributionBarChart data={data.turnaroundDistribution} />
        </SectionCard>

        <SectionCard
          title="Top denial reasons"
          description="What payers cite most when a request is denied."
        >
          {data.denialReasons.length === 0 ? (
            <EmptyState
              icon={XCircle}
              title="No denials yet"
              description="Denial reasons will appear here once requests are denied."
            />
          ) : (
            <ul className="space-y-3.5">
              {data.denialReasons.map((r) => (
                <li key={r.label}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-pretty text-foreground/90">{r.label}</span>
                    <span className="shrink-0 font-medium tabular-nums">{r.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-rose-500/55"
                      style={{ width: `${maxReason > 0 ? (r.value / maxReason) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Volume by drug"
          description="Which therapies drive the most prior authorizations."
        >
          <HorizontalBarChart
            data={data.volumeByDrug}
            ariaLabel="Prior authorization volume by drug"
            height={Math.max(220, data.volumeByDrug.length * 34)}
          />
        </SectionCard>

        <SectionCard
          title="Where requests sit"
          description="Open requests by current stage, the practice and payer queues."
        >
          <HorizontalBarChart
            data={data.openByStatus}
            ariaLabel="Open requests by status"
            height={Math.max(220, data.openByStatus.length * 34)}
          />
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="AI letter assistant"
          description="Observability for the Letter of Medical Necessity generator: latency, model fallback, and token usage."
        >
          {assistant.total === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No generations yet"
              description="Generate a letter on any request to start collecting telemetry."
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat
                  label="Generations"
                  value={String(assistant.total)}
                  sub={`${assistant.last7d} in last 7 days`}
                />
                <Stat
                  label="Avg latency"
                  value={formatMs(assistant.avgLatencyMs)}
                  sub="per generation"
                />
                <Stat
                  label="Fallback rate"
                  value={`${assistant.fallbackRate}%`}
                  sub="served by template"
                />
                <Stat
                  label="Output tokens"
                  value={assistant.totalOutputTokens.toLocaleString()}
                  sub="model generated"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {assistant.byStatus.map((s) => (
                  <span
                    key={s.status}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      TONE[STATUS_TONE[s.status] ?? "neutral"].pill,
                    )}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                    <span className="tabular-nums">{s.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

const STATUS_LABEL: Record<string, string> = {
  ok: "Served",
  rate_limited: "Rate limited",
  capped: "Spend capped",
  error: "Error",
}

const STATUS_TONE: Record<string, Tone> = {
  ok: "success",
  rate_limited: "warning",
  capped: "neutral",
  error: "danger",
}

function formatMs(ms: number | null): string {
  if (ms === null) return "n/a"
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}
