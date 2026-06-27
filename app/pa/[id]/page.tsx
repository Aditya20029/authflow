import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"

import { getPaDetail } from "@/lib/data/pa"
import { statusMeta } from "@/lib/status"
import { formatDateTime } from "@/lib/format"
import { PageContainer } from "@/components/primitives/page-container"
import { SectionCard } from "@/components/primitives/section-card"
import { StatusPill } from "@/components/primitives/status-pill"
import { PriorityTag } from "@/components/primitives/priority-tag"
import { DeadlineBadge } from "@/components/primitives/deadline-badge"
import { Timeline } from "@/components/primitives/timeline"
import { PaActionBar } from "@/components/pa/pa-action-bar"
import { MedicationCard } from "@/components/pa/medication-card"
import { CoveragePanel } from "@/components/pa/coverage-panel"
import { DocumentsChecklist } from "@/components/pa/documents-checklist"
import { JustificationPanel } from "@/components/pa/justification-panel"
import { LetterEditor } from "@/components/pa/letter-editor"
import { SummaryCard } from "@/components/pa/summary-card"
import { ChartSnapshot } from "@/components/pa/chart-snapshot"

export const dynamic = "force-dynamic"

export default async function PaDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const pa = await getPaDetail(params.id)
  if (!pa) notFound()

  const timelineItems = pa.timeline.map((e) => ({
    id: e.id,
    title: statusMeta(e.toStatus).label,
    description: e.note,
    meta: formatDateTime(e.createdAt),
    dotClass: statusMeta(e.toStatus).dot,
  }))

  return (
    <PageContainer>
      <div className="space-y-4">
        <Link
          href="/worklist"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Worklist
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-code text-sm text-muted-foreground">
                {pa.referenceId}
              </span>
              <StatusPill status={pa.status} />
              <PriorityTag priority={pa.priority} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {pa.patient.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {pa.medication.name} for {pa.payer.name}
            </p>
          </div>
          <DeadlineBadge
            state={pa.deadlineInfo.state}
            label={pa.deadlineInfo.label}
            className="text-sm"
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card">
        <PaActionBar
          paId={pa.id}
          status={pa.status}
          payerName={pa.payer.name}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Medication and service">
            <MedicationCard pa={pa} />
          </SectionCard>

          <SectionCard
            title="Coverage requirements"
            description="Why this order needs prior authorization, from the payer rules."
          >
            <CoveragePanel pa={pa} />
          </SectionCard>

          <SectionCard
            title="Required documentation"
            description="Auto-assembled from the chart. Anything missing is flagged to capture now."
          >
            <DocumentsChecklist documents={pa.documents} />
          </SectionCard>

          <SectionCard title="Clinical justification">
            <JustificationPanel pa={pa} />
          </SectionCard>

          <SectionCard
            title="Letter of medical necessity"
            description="Draft a letter from the chart with the AI assistant, then review, edit, and save it."
          >
            <LetterEditor
              paId={pa.id}
              initialLetter={pa.letterOfMedicalNecessity ?? ""}
            />
          </SectionCard>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <SectionCard title="Request details">
            <SummaryCard pa={pa} />
          </SectionCard>

          <SectionCard title="Status timeline">
            <Timeline items={timelineItems} />
          </SectionCard>

          <SectionCard title="Chart snapshot">
            <ChartSnapshot chart={pa.patient.chart} />
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  )
}
