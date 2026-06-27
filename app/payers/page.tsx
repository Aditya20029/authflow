import { Building2, ShieldCheck } from "lucide-react"

import { getPayers, type PayerRuleView, type PayerView } from "@/lib/data/payers"
import { displayList } from "@/lib/rules"
import { cn } from "@/lib/utils"
import { TONE } from "@/lib/status"
import { PageContainer } from "@/components/primitives/page-container"
import { PageHeader } from "@/components/primitives/page-header"
import { SectionCard } from "@/components/primitives/section-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

export default async function PayersPage() {
  const payers = await getPayers()

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Coverage"
        title="Payers"
        description="Browse each plan and the criteria that trigger a prior authorization."
      />
      <div className="mt-6 space-y-4">
        {payers.map((payer) => (
          <PayerCard key={payer.id} payer={payer} />
        ))}
      </div>
    </PageContainer>
  )
}

function PayerCard({ payer }: { payer: PayerView }) {
  return (
    <SectionCard
      contentClassName="px-0"
      title={
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </span>
          {payer.name}
        </span>
      }
      description={
        <span className="font-code text-xs">
          {payer.planType} · {payer.formularyRef}
        </span>
      }
      action={
        <div className="text-right text-xs text-muted-foreground">
          <div className="font-medium tabular-nums text-foreground">
            {payer.paRequiredCount} gated
          </div>
          <div className="tabular-nums">{payer.requestCount} requests</div>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Medication</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Criteria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payer.rules.map((rule) => (
              <RuleRow key={rule.medicationName} rule={rule} />
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  )
}

function RuleRow({ rule }: { rule: PayerRuleView }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="align-top">
        <div className="font-medium">{rule.medicationName}</div>
        <div className="text-xs text-muted-foreground">{rule.drugClass}</div>
      </TableCell>
      <TableCell className="align-top">
        {rule.paRequired ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
              TONE.neutral.pill,
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
            PA required
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
              TONE.success.pill,
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            No PA
          </span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          {rule.criteriaSummary}
        </p>
        {rule.paRequired && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {rule.stepTherapyRequired && <Flag>Step therapy</Flag>}
            {rule.requiredLabs.length > 0 && (
              <Flag>Labs: {displayList(rule.requiredLabs)}</Flag>
            )}
            {rule.quantityLimit && <Flag>Quantity limit</Flag>}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}
