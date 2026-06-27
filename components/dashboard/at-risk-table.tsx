import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusPill } from "@/components/primitives/status-pill"
import { DeadlineBadge } from "@/components/primitives/deadline-badge"
import { PriorityTag } from "@/components/primitives/priority-tag"
import { LinkRow } from "@/components/primitives/link-row"
import { EmptyState } from "@/components/primitives/empty-state"
import type { WorklistRow } from "@/lib/data/worklist"

export function AtRiskTable({ rows }: { rows: WorklistRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nothing at risk"
        description="No open requests are approaching or past their deadline. Nicely kept."
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Request</TableHead>
            <TableHead className="hidden md:table-cell">Medication</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <LinkRow key={r.id} href={`/pa/${r.id}`}>
              <TableCell>
                <Link
                  href={`/pa/${r.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {r.patientName}
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-code text-xs text-muted-foreground">
                    {r.referenceId}
                  </span>
                  <PriorityTag priority={r.priority} />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="text-sm">{r.medicationName}</span>
                {r.medicationBrand && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {r.medicationBrand}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <StatusPill status={r.status} />
              </TableCell>
              <TableCell className="text-right">
                <DeadlineBadge state={r.deadlineState} label={r.deadlineLabel} />
              </TableCell>
            </LinkRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
