import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { isDecided } from "@/lib/status"
import { getDeadlineInfo, type DeadlineState } from "@/lib/deadline"
import { formatRelative } from "@/lib/format"

export type WorklistRow = {
  id: string
  referenceId: string
  patientName: string
  mrn: string
  medicationName: string
  medicationBrand: string | null
  payerName: string
  status: string
  priority: string
  createdAtIso: string
  createdLabel: string
  deadlineState: DeadlineState
  deadlineLabel: string
  hoursLeft: number | null
  decided: boolean
  coordinator: string | null
}

export const worklistInclude = {
  patient: { select: { firstName: true, lastName: true, mrn: true } },
  medication: { select: { name: true, brandName: true } },
  payer: { select: { name: true } },
} satisfies Prisma.PriorAuthRequestInclude

type WorklistRecord = Prisma.PriorAuthRequestGetPayload<{
  include: typeof worklistInclude
}>

export function toWorklistRow(r: WorklistRecord): WorklistRow {
  const decided = isDecided(r.status)
  const deadline = getDeadlineInfo(r.deadline, decided)
  return {
    id: r.id,
    referenceId: r.referenceId,
    patientName: `${r.patient.firstName} ${r.patient.lastName}`,
    mrn: r.patient.mrn,
    medicationName: r.medication.name,
    medicationBrand: r.medication.brandName,
    payerName: r.payer.name,
    status: r.status,
    priority: r.priority,
    createdAtIso: r.createdAt.toISOString(),
    createdLabel: formatRelative(r.createdAt),
    deadlineState: deadline.state,
    deadlineLabel: deadline.label,
    hoursLeft: deadline.hoursLeft,
    decided,
    coordinator: r.assignedCoordinator,
  }
}

export async function getWorklist(): Promise<WorklistRow[]> {
  const rows = await prisma.priorAuthRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: worklistInclude,
  })
  return rows.map(toWorklistRow)
}
