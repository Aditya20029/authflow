import { prisma } from "@/lib/prisma"
import { parsePatientChart, parseStringArray } from "@/lib/chart"
import {
  evaluateCoverage,
  assessReadiness,
  type DocSpec,
  type CoverageResult,
  type ReadinessResult,
} from "@/lib/rules"
import { isDecided } from "@/lib/status"
import { getDeadlineInfo } from "@/lib/deadline"
import { age } from "@/lib/format"
import type { PatientChart, RuleCriteria } from "@/types"

export type PaDocument = {
  id: string
  label: string
  source: string
  satisfied: boolean
  evidence: string | null
}

export type PaTimelineEvent = {
  id: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: Date
}

export type PaDetail = {
  id: string
  referenceId: string
  status: string
  priority: string
  decided: boolean
  createdAt: Date
  submittedAt: Date | null
  decisionAt: Date | null
  deadline: Date
  deadlineInfo: ReturnType<typeof getDeadlineInfo>
  turnaroundHours: number | null
  diagnosisCode: string
  diagnosisLabel: string
  clinicalJustification: string | null
  letterOfMedicalNecessity: string | null
  denialReason: string | null
  appealStatus: string | null
  coordinator: string | null
  patient: {
    id: string
    name: string
    firstName: string
    mrn: string
    memberId: string
    sex: string
    age: number
    weightKg: number | null
    chart: PatientChart
  }
  provider: { name: string; npi: string; specialty: string }
  payer: { name: string; planType: string; formularyRef: string }
  medication: {
    name: string
    brandName: string | null
    drugClass: string
    ndc: string
    hcpcs: string | null
    cpt: string | null
    isSpecialty: boolean
    route: string | null
    indication: string
  }
  criteria: RuleCriteria | null
  coverage: CoverageResult
  documents: PaDocument[]
  readiness: ReadinessResult
  timeline: PaTimelineEvent[]
}

export async function getPaDetail(id: string): Promise<PaDetail | null> {
  const r = await prisma.priorAuthRequest.findUnique({
    where: { id },
    include: {
      patient: true,
      provider: true,
      payer: true,
      medication: true,
      requiredDocuments: { orderBy: { createdAt: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!r) return null

  const rule = await prisma.payerRule.findUnique({
    where: {
      payerId_medicationId: { payerId: r.payerId, medicationId: r.medicationId },
    },
  })

  const criteria: RuleCriteria | null = rule
    ? {
        paRequired: rule.paRequired,
        stepTherapyRequired: rule.stepTherapyRequired,
        requiredDiagnoses: parseStringArray(rule.requiredDiagnoses),
        requiredPriorTherapies: parseStringArray(rule.requiredPriorTherapies),
        requiredLabs: parseStringArray(rule.requiredLabs),
        quantityLimit: rule.quantityLimit,
        criteriaSummary: rule.criteriaSummary,
      }
    : null

  const coverage = evaluateCoverage({
    planName: r.payer.name,
    drugName: r.medication.name,
    drugClass: r.medication.drugClass,
    isSpecialty: r.medication.isSpecialty,
    criteria,
  })

  const documents: PaDocument[] = r.requiredDocuments.map((d) => ({
    id: d.id,
    label: d.label,
    source: d.source,
    satisfied: d.satisfied,
    evidence: d.evidence,
  }))

  const docSpecs: DocSpec[] = documents.map((d) => ({
    label: d.label,
    source: d.source as DocSpec["source"],
    satisfied: d.satisfied,
    evidence: d.evidence ?? undefined,
  }))

  const decided = isDecided(r.status)

  return {
    id: r.id,
    referenceId: r.referenceId,
    status: r.status,
    priority: r.priority,
    decided,
    createdAt: r.createdAt,
    submittedAt: r.submittedAt,
    decisionAt: r.decisionAt,
    deadline: r.deadline,
    deadlineInfo: getDeadlineInfo(r.deadline, decided),
    turnaroundHours: r.turnaroundHours,
    diagnosisCode: r.diagnosisCode,
    diagnosisLabel: r.diagnosisLabel,
    clinicalJustification: r.clinicalJustification,
    letterOfMedicalNecessity: r.letterOfMedicalNecessity,
    denialReason: r.denialReason,
    appealStatus: r.appealStatus,
    coordinator: r.assignedCoordinator,
    patient: {
      id: r.patient.id,
      name: `${r.patient.firstName} ${r.patient.lastName}`,
      firstName: r.patient.firstName,
      mrn: r.patient.mrn,
      memberId: r.patient.memberId,
      sex: r.patient.sex,
      age: age(r.patient.dateOfBirth),
      weightKg: r.patient.weightKg,
      chart: parsePatientChart(r.patient),
    },
    provider: {
      name: `Dr. ${r.provider.firstName} ${r.provider.lastName}`,
      npi: r.provider.npi,
      specialty: r.provider.specialty,
    },
    payer: {
      name: r.payer.name,
      planType: r.payer.planType,
      formularyRef: r.payer.formularyRef,
    },
    medication: {
      name: r.medication.name,
      brandName: r.medication.brandName,
      drugClass: r.medication.drugClass,
      ndc: r.medication.ndc,
      hcpcs: r.medication.hcpcs,
      cpt: r.medication.cpt,
      isSpecialty: r.medication.isSpecialty,
      route: r.medication.route,
      indication: r.medication.indication,
    },
    criteria,
    coverage,
    documents,
    readiness: assessReadiness(docSpecs),
    timeline: r.statusEvents.map((e) => ({
      id: e.id,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      note: e.note,
      createdAt: e.createdAt,
    })),
  }
}
