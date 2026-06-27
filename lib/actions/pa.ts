"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { parsePatientChart, parseStringArray } from "@/lib/chart"
import {
  buildRequiredDocuments,
  assessReadiness,
  decidePriorAuth,
  matchDiagnosis,
} from "@/lib/rules"
import { priorityMeta, type Priority } from "@/lib/status"
import type { PatientChart, RuleCriteria } from "@/types"

const H = 3_600_000
const EMPTY_CHART: PatientChart = { diagnoses: [], priorTherapies: [], labs: [] }

type RuleRow = {
  paRequired: boolean
  stepTherapyRequired: boolean
  requiredDiagnoses: string
  requiredPriorTherapies: string
  requiredLabs: string
  quantityLimit: boolean
  criteriaSummary: string
}

function criteriaFromRule(rule: RuleRow | null): RuleCriteria | null {
  if (!rule) return null
  return {
    paRequired: rule.paRequired,
    stepTherapyRequired: rule.stepTherapyRequired,
    requiredDiagnoses: parseStringArray(rule.requiredDiagnoses),
    requiredPriorTherapies: parseStringArray(rule.requiredPriorTherapies),
    requiredLabs: parseStringArray(rule.requiredLabs),
    quantityLimit: rule.quantityLimit,
    criteriaSummary: rule.criteriaSummary,
  }
}

function draftJustification(
  firstName: string,
  dxLabel: string,
  drug: string,
  chart: PatientChart,
  planName: string,
): string {
  const trial = chart.priorTherapies.find((p) =>
    ["failed", "intolerant", "partial"].includes(p.outcome),
  )
  const trialPhrase = trial
    ? `an inadequate response to ${trial.name}`
    : "disease not controlled on first-line therapy"
  return `${firstName} has ${dxLabel} with ${trialPhrase}. ${drug} is medically necessary to achieve disease control and is requested per ${planName} criteria.`
}

async function uniqueReferenceId(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const ref = `PA-${Math.floor(100000 + Math.random() * 899999)}`
    const exists = await prisma.priorAuthRequest.findUnique({
      where: { referenceId: ref },
      select: { id: true },
    })
    if (!exists) return ref
  }
  return `PA-${Date.now().toString(36).toUpperCase()}`
}

function revalidateAll(paId: string) {
  revalidatePath("/")
  revalidatePath("/worklist")
  revalidatePath("/analytics")
  revalidatePath(`/pa/${paId}`)
}

// CRD: create a request at the point of care, then send the user to its detail.
export async function createPriorAuth(input: {
  patientId: string
  providerId: string
  medicationId: string
  priority: string
}) {
  const [patient, provider, medication] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: input.patientId },
      include: { payer: true },
    }),
    prisma.provider.findUnique({ where: { id: input.providerId } }),
    prisma.medication.findUnique({ where: { id: input.medicationId } }),
  ])
  if (!patient || !provider || !medication || !patient.payer || !patient.payerId) {
    throw new Error("Order details are incomplete. Pick a patient, prescriber, and medication.")
  }

  const rule = await prisma.payerRule.findUnique({
    where: {
      payerId_medicationId: {
        payerId: patient.payerId,
        medicationId: medication.id,
      },
    },
  })
  const criteria = criteriaFromRule(rule)
  if (!criteria || !criteria.paRequired) {
    throw new Error("No prior authorization is required for this order.")
  }

  const chart = parsePatientChart(patient)
  const providerName = `Dr. ${provider.firstName} ${provider.lastName}`

  // Requirements are identified but not yet auto-filled. Member ID and
  // prescriber are known immediately; clinical evidence is pulled by auto-fill.
  const docs = buildRequiredDocuments({
    drugName: medication.name,
    criteria,
    chart: EMPTY_CHART,
    memberId: patient.memberId,
    providerName,
    providerNpi: provider.npi,
    hasLetterOfMedicalNecessity: false,
  })

  const dx =
    matchDiagnosis(chart, criteria.requiredDiagnoses) ??
    chart.diagnoses[0] ?? { code: "R69", label: "Illness, unspecified" }

  const priority = (["Routine", "Urgent", "STAT"].includes(input.priority)
    ? input.priority
    : "Routine") as Priority
  const now = new Date()
  const deadline = new Date(now.getTime() + priorityMeta(priority).slaHours * H)
  const referenceId = await uniqueReferenceId()

  const created = await prisma.priorAuthRequest.create({
    data: {
      referenceId,
      status: "NeedsDocumentation",
      priority,
      diagnosisCode: dx.code,
      diagnosisLabel: dx.label,
      assignedCoordinator: "Alex Rivera",
      createdAt: now,
      deadline,
      patient: { connect: { id: patient.id } },
      provider: { connect: { id: provider.id } },
      medication: { connect: { id: medication.id } },
      payer: { connect: { id: patient.payerId } },
      requiredDocuments: {
        create: docs.map((d) => ({
          label: d.label,
          source: d.source,
          satisfied: d.satisfied,
          evidence: d.evidence ?? null,
        })),
      },
      statusEvents: {
        create: [
          {
            fromStatus: null,
            toStatus: "NeedsDocumentation",
            note: "Order captured at point of care; required documentation identified.",
            createdAt: now,
          },
        ],
      },
    },
  })

  revalidateAll(created.id)
  redirect(`/pa/${created.id}`)
}

// DTR: pull every available item from the chart into the checklist.
export async function autoFillFromChart(paId: string) {
  const pa = await prisma.priorAuthRequest.findUnique({
    where: { id: paId },
    include: {
      patient: true,
      provider: true,
      medication: true,
      payer: true,
      requiredDocuments: true,
    },
  })
  if (!pa) throw new Error("Request not found.")

  const rule = await prisma.payerRule.findUnique({
    where: {
      payerId_medicationId: { payerId: pa.payerId, medicationId: pa.medicationId },
    },
  })
  const criteria = criteriaFromRule(rule)
  if (!criteria) throw new Error("No payer criteria found for this request.")

  const chart = parsePatientChart(pa.patient)
  const providerName = `Dr. ${pa.provider.firstName} ${pa.provider.lastName}`

  const fresh = buildRequiredDocuments({
    drugName: pa.medication.name,
    criteria,
    chart,
    memberId: pa.patient.memberId,
    providerName,
    providerNpi: pa.provider.npi,
    hasLetterOfMedicalNecessity: Boolean(pa.letterOfMedicalNecessity),
  })
  const freshByLabel = new Map(fresh.map((d) => [d.label, d]))

  await Promise.all(
    pa.requiredDocuments.map((doc) => {
      const f = freshByLabel.get(doc.label)
      if (!f) return Promise.resolve(null)
      return prisma.requiredDocument.update({
        where: { id: doc.id },
        data: { satisfied: f.satisfied, evidence: f.evidence ?? null },
      })
    }),
  )

  const readiness = assessReadiness(fresh)
  const newStatus = readiness.allSatisfied ? "ReadyToSubmit" : "NeedsDocumentation"
  const justification =
    pa.clinicalJustification ??
    draftJustification(
      pa.patient.firstName,
      pa.diagnosisLabel,
      pa.medication.name,
      chart,
      pa.payer.name,
    )

  await prisma.priorAuthRequest.update({
    where: { id: paId },
    data: {
      status: newStatus,
      clinicalJustification: justification,
      statusEvents: {
        create: [
          {
            fromStatus: pa.status,
            toStatus: newStatus,
            note: `Chart auto-fill completed. ${readiness.satisfied} of ${readiness.total} requirements satisfied.`,
            createdAt: new Date(),
          },
        ],
      },
    },
  })

  revalidateAll(paId)
}

// PAS: send to the payer.
export async function submitToPayer(paId: string) {
  const pa = await prisma.priorAuthRequest.findUnique({
    where: { id: paId },
    include: { payer: true },
  })
  if (!pa) throw new Error("Request not found.")

  const now = new Date()
  await prisma.priorAuthRequest.update({
    where: { id: paId },
    data: {
      status: "Submitted",
      submittedAt: pa.submittedAt ?? now,
      statusEvents: {
        create: [
          {
            fromStatus: pa.status,
            toStatus: "Submitted",
            note: `Submitted to ${pa.payer.name}.`,
            createdAt: now,
          },
        ],
      },
    },
  })
  revalidateAll(paId)
}

// PAS: resolve the decision deterministically from the rules engine.
export async function simulateDecision(paId: string): Promise<string> {
  const pa = await prisma.priorAuthRequest.findUnique({
    where: { id: paId },
    include: { patient: true, provider: true, medication: true, payer: true },
  })
  if (!pa) throw new Error("Request not found.")

  const rule = await prisma.payerRule.findUnique({
    where: {
      payerId_medicationId: { payerId: pa.payerId, medicationId: pa.medicationId },
    },
  })
  const criteria = criteriaFromRule(rule)
  if (!criteria) throw new Error("No payer criteria found for this request.")

  const chart = parsePatientChart(pa.patient)
  const decision = decidePriorAuth({
    drugName: pa.medication.name,
    criteria,
    chart,
    memberId: pa.patient.memberId,
    providerName: `Dr. ${pa.provider.firstName} ${pa.provider.lastName}`,
    providerNpi: pa.provider.npi,
    hasLetterOfMedicalNecessity: Boolean(pa.letterOfMedicalNecessity),
  })

  const now = new Date()
  // Fall back to createdAt (not now) so a decision can never record a spurious
  // 0-hour turnaround if the request somehow lacks a submission timestamp.
  const submittedAt = pa.submittedAt ?? pa.createdAt
  const turnaround =
    Math.round(((now.getTime() - submittedAt.getTime()) / H) * 10) / 10

  if (decision.decision === "Approved") {
    await prisma.priorAuthRequest.update({
      where: { id: paId },
      data: {
        status: "Approved",
        decisionAt: now,
        submittedAt,
        turnaroundHours: Math.max(0, turnaround),
        denialReason: null,
        statusEvents: {
          create: [
            {
              fromStatus: pa.status,
              toStatus: "Approved",
              note: `Approved by ${pa.payer.name}.`,
              createdAt: now,
            },
          ],
        },
      },
    })
  } else if (decision.decision === "Denied") {
    await prisma.priorAuthRequest.update({
      where: { id: paId },
      data: {
        status: "Denied",
        decisionAt: now,
        submittedAt,
        turnaroundHours: Math.max(0, turnaround),
        denialReason: decision.reason,
        statusEvents: {
          create: [
            {
              fromStatus: pa.status,
              toStatus: "Denied",
              note: `Denied: ${decision.reason}`,
              createdAt: now,
            },
          ],
        },
      },
    })
  } else {
    await prisma.priorAuthRequest.update({
      where: { id: paId },
      data: {
        status: "NeedsDocumentation",
        statusEvents: {
          create: [
            {
              fromStatus: pa.status,
              toStatus: "NeedsDocumentation",
              note: `Payer requested additional information: ${decision.reason}`,
              createdAt: now,
            },
          ],
        },
      },
    })
  }

  revalidateAll(paId)
  return decision.decision
}

export async function startAppeal(paId: string) {
  const pa = await prisma.priorAuthRequest.findUnique({ where: { id: paId } })
  if (!pa) throw new Error("Request not found.")
  if (pa.status !== "Denied") {
    throw new Error("Only denied requests can be appealed.")
  }

  const now = new Date()
  await prisma.priorAuthRequest.update({
    where: { id: paId },
    data: {
      status: "Appealed",
      appealStatus: "Submitted",
      statusEvents: {
        create: [
          {
            fromStatus: "Denied",
            toStatus: "Appealed",
            note: "Appeal submitted to the payer.",
            createdAt: now,
          },
        ],
      },
    },
  })
  revalidateAll(paId)
}

// Persists an edited Letter of Medical Necessity (used by the AI assistant).
export async function saveLetter(paId: string, letter: string) {
  if (typeof letter !== "string" || letter.trim().length === 0) {
    throw new Error("The letter is empty. Generate or write one before saving.")
  }
  await prisma.priorAuthRequest.update({
    where: { id: paId },
    data: { letterOfMedicalNecessity: letter },
  })
  await prisma.requiredDocument.updateMany({
    where: { requestId: paId, label: "Letter of medical necessity" },
    data: { satisfied: true, evidence: "Drafted for clinician review" },
  })
  revalidateAll(paId)
}
