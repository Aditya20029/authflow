import Link from "next/link"
import {
  Clock,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Percent,
  PlusCircle,
  ArrowRight,
} from "lucide-react"

import { getDashboardData } from "@/lib/data/dashboard"
import { formatHours, formatPercent } from "@/lib/format"
import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { SectionCard } from "@/components/primitives/section-card"
import { KpiCard } from "@/components/primitives/kpi-card"
import { Button } from "@/components/ui/button"
import {
  VolumeAreaChart,
  StatusDonut,
  TurnaroundBarChart,
  ApprovalLineChart,
} from "@/components/charts/dashboard-charts"
import { AtRiskTable } from "@/components/dashboard/at-risk-table"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const data = await getDashboardData()
  const k = data.kpis

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Practice-wide prior authorization health at a glance."
      >
        <Button asChild>
          <Link href="/new">
            <PlusCircle className="h-4 w-4" />
            New request
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Pending PAs"
          value={String(k.pending)}
          icon={Clock}
          trend={k.pendingTrend}
          sublabel={`${k.totalActive} active total`}
        />
        <KpiCard
          label="Approved this month"
          value={String(k.approvedThisMonth)}
          icon={CheckCircle2}
          tone="success"
          trend={k.approvedTrend}
        />
        <KpiCard
          label="Avg turnaround"
          value={formatHours(k.avgTurnaroundHours)}
          icon={Timer}
          trend={k.turnaroundTrend}
          sublabel="last 30 days"
        />
        <KpiCard
          label="At risk"
          value={String(k.atRisk)}
          icon={AlertTriangle}
          tone={k.overdue > 0 ? "danger" : "warning"}
          sublabel={k.overdue > 0 ? `${k.overdue} overdue` : "within 48 hours"}
        />
        <KpiCard
          label="Approval rate"
          value={formatPercent(k.approvalRate)}
          icon={Percent}
          tone="success"
          trend={k.approvalRateTrend}
          sublabel="approved vs denied"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Request volume"
          description="New prior authorizations per week over the last 13 weeks."
        >
          <VolumeAreaChart data={data.volume} />
        </SectionCard>
        <SectionCard title="Status mix" description="All requests by current status.">
          <StatusDonut data={data.statusBreakdown} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Turnaround by payer"
          description="Average hours from submission to decision."
        >
          <TurnaroundBarChart data={data.turnaroundByPayer} />
        </SectionCard>
        <SectionCard
          title="Approval rate trend"
          description="Weekly approved share of decided requests."
        >
          <ApprovalLineChart data={data.approvalTrend} />
        </SectionCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          contentClassName="px-0"
          title="At risk and overdue"
          description="Open requests approaching or past their deadline."
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/worklist">
                View worklist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        >
          <AtRiskTable rows={data.atRiskRows} />
        </SectionCard>
        <SectionCard title="Recent activity" description="The latest status changes.">
          <ActivityFeed items={data.activity} />
        </SectionCard>
      </div>
    </PageContainer>
  )
}
