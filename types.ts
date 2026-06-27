// Shared domain types derived from the Prisma models. JSON-encoded String
// columns (patient chart, payer criteria) are parsed into these shapes by the
// helpers in lib/chart.ts.

export type TherapyOutcome = "failed" | "intolerant" | "partial" | "ongoing"

export type LabFlag = "low" | "normal" | "high" | "critical"

export type Diagnosis = {
  code: string
  label: string
  since?: string
}

export type PriorTherapy = {
  name: string
  drugClass: string
  outcome: TherapyOutcome
  note?: string
}

export type LabResult = {
  name: string
  value: string
  unit?: string
  date: string
  flag?: LabFlag
}

export type PatientChart = {
  diagnoses: Diagnosis[]
  priorTherapies: PriorTherapy[]
  labs: LabResult[]
}

// Structured payer criteria used by the rules engine (lib/rules).
export type RuleCriteria = {
  paRequired: boolean
  stepTherapyRequired: boolean
  requiredDiagnoses: string[]
  requiredPriorTherapies: string[]
  requiredLabs: string[]
  quantityLimit: boolean
  criteriaSummary: string
}
