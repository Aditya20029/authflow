import { prisma } from "@/lib/prisma"
import { parsePatientChart, parseStringArray } from "@/lib/chart"
import { age } from "@/lib/format"
import type { PatientChart, RuleCriteria } from "@/types"

export type IntakePatient = {
  id: string
  name: string
  mrn: string
  memberId: string
  payerId: string
  payerName: string
  age: number
  sex: string
  chart: PatientChart
}

export type IntakeProvider = {
  id: string
  name: string
  npi: string
  specialty: string
}

export type IntakeMedication = {
  id: string
  name: string
  brandName: string | null
  drugClass: string
  isSpecialty: boolean
}

export type IntakeData = {
  patients: IntakePatient[]
  providers: IntakeProvider[]
  medications: IntakeMedication[]
  rules: Record<string, RuleCriteria>
}

export function ruleKey(payerId: string, medicationId: string): string {
  return `${payerId}:${medicationId}`
}

export async function getIntakeData(): Promise<IntakeData> {
  const [patientRows, providerRows, medicationRows, ruleRows] = await Promise.all([
    prisma.patient.findMany({
      where: { payerId: { not: null } },
      include: { payer: true },
      orderBy: { firstName: "asc" },
      take: 40,
    }),
    prisma.provider.findMany({ orderBy: { lastName: "asc" } }),
    prisma.medication.findMany({ orderBy: { name: "asc" } }),
    prisma.payerRule.findMany(),
  ])

  const patients: IntakePatient[] = patientRows
    .filter((p) => p.payer)
    .map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      mrn: p.mrn,
      memberId: p.memberId,
      payerId: p.payerId as string,
      payerName: p.payer!.name,
      age: age(p.dateOfBirth),
      sex: p.sex,
      chart: parsePatientChart(p),
    }))

  const providers: IntakeProvider[] = providerRows.map((p) => ({
    id: p.id,
    name: `Dr. ${p.firstName} ${p.lastName}`,
    npi: p.npi,
    specialty: p.specialty,
  }))

  const medications: IntakeMedication[] = medicationRows.map((m) => ({
    id: m.id,
    name: m.name,
    brandName: m.brandName,
    drugClass: m.drugClass,
    isSpecialty: m.isSpecialty,
  }))

  const rules: Record<string, RuleCriteria> = {}
  for (const r of ruleRows) {
    rules[ruleKey(r.payerId, r.medicationId)] = {
      paRequired: r.paRequired,
      stepTherapyRequired: r.stepTherapyRequired,
      requiredDiagnoses: parseStringArray(r.requiredDiagnoses),
      requiredPriorTherapies: parseStringArray(r.requiredPriorTherapies),
      requiredLabs: parseStringArray(r.requiredLabs),
      quantityLimit: r.quantityLimit,
      criteriaSummary: r.criteriaSummary,
    }
  }

  return { patients, providers, medications, rules }
}
