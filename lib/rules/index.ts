// AuthFlow rules engine.
//
// Pure, deterministic, and free of any database or React imports so it can be
// unit tested in isolation and reused identically by the seed, the server
// actions, and the point-of-care intake. It models the three Da Vinci stages:
//
//   CRD  evaluateCoverage      is a prior authorization required, and why
//   DTR  buildRequiredDocuments which documents the payer needs, auto-satisfied
//                               from the patient chart wherever possible
//   PAS  decidePriorAuth        a deterministic, criteria-driven decision
//
// Decisions are never random. Given the same chart and payer criteria, the
// engine always returns the same result.

import type { PatientChart, PriorTherapy, LabResult, RuleCriteria } from "@/types"
import type { DocSource, PaStatus } from "@/lib/status"

const norm = (s: string) => s.toLowerCase().trim()

/** Join a list into readable prose: "A", "A and B", "A, B, and C". */
export function displayList(items: string[]): string {
  const clean = items.filter(Boolean)
  if (clean.length === 0) return ""
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`
}

// ---------------------------------------------------------------------------
// Matching helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export function matchDiagnosis(chart: PatientChart, requiredCodes: string[]) {
  for (const required of requiredCodes) {
    const r = norm(required)
    const hit = chart.diagnoses.find((d) => {
      const c = norm(d.code)
      return c === r || c.startsWith(r) || r.startsWith(c)
    })
    if (hit) return hit
  }
  return null
}

const TRIAL_OUTCOMES = new Set<PriorTherapy["outcome"]>([
  "failed",
  "intolerant",
  "partial",
])

export function matchStepTherapy(
  chart: PatientChart,
  requiredTherapies: string[],
): PriorTherapy | null {
  const trials = chart.priorTherapies.filter((t) => TRIAL_OUTCOMES.has(t.outcome))
  if (trials.length === 0) return null
  if (requiredTherapies.length === 0) return trials[0]
  for (const t of trials) {
    const name = norm(t.name)
    const cls = norm(t.drugClass)
    const matches = requiredTherapies.some((req) => {
      const r = norm(req)
      return (
        name.includes(r) ||
        r.includes(name) ||
        cls.includes(r) ||
        r.includes(cls)
      )
    })
    if (matches) return t
  }
  return null
}

// Generic words that carry no identifying signal for a lab. Dropping them lets
// short but meaningful abbreviations (TB, PD, L1) drive the match instead.
const LAB_STOPWORDS = new Set([
  "with", "and", "panel", "test", "testing", "screen", "screening",
  "count", "level", "levels", "of", "the", "serum", "blood",
  "result", "results", "recent",
])

function tokens(label: string): string[] {
  return norm(label)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !LAB_STOPWORDS.has(t))
}

export function matchLab(chart: PatientChart, requiredLabel: string): LabResult | null {
  const reqTokens = tokens(requiredLabel)
  return (
    chart.labs.find((l) => {
      const name = norm(l.name)
      const r = norm(requiredLabel)
      if (name.includes(r) || r.includes(name)) return true
      const labTokens = tokens(l.name)
      return reqTokens.some((t) => labTokens.includes(t))
    }) ?? null
  )
}

// ---------------------------------------------------------------------------
// CRD: Coverage Requirements Discovery
// ---------------------------------------------------------------------------

export type CoverageInput = {
  planName: string
  drugName: string
  drugClass: string
  isSpecialty: boolean
  criteria: RuleCriteria | null
}

export type CoverageResult = {
  required: boolean
  reasons: string[]
  summary: string
}

export function evaluateCoverage(input: CoverageInput): CoverageResult {
  const { planName, drugName, drugClass, isSpecialty, criteria } = input

  if (!criteria || !criteria.paRequired) {
    return {
      required: false,
      reasons: [
        `${planName} does not require prior authorization for ${drugName}. The order can proceed without one.`,
      ],
      summary: "No prior authorization required",
    }
  }

  const reasons: string[] = [
    `${planName} requires prior authorization for ${drugName} (${drugClass}).`,
  ]
  if (isSpecialty) {
    reasons.push(
      `${drugName} is a specialty or biologic agent subject to utilization management.`,
    )
  }
  if (criteria.stepTherapyRequired) {
    const list = displayList(criteria.requiredPriorTherapies)
    reasons.push(
      list
        ? `Step therapy applies: a documented trial of ${list} is required first.`
        : `Step therapy applies: a documented trial of a preferred agent is required first.`,
    )
  }
  if (criteria.requiredDiagnoses.length > 0) {
    reasons.push(
      `Coverage is limited to approved indications (${displayList(
        criteria.requiredDiagnoses,
      )}).`,
    )
  }
  if (criteria.requiredLabs.length > 0) {
    reasons.push(
      `Recent results required: ${displayList(criteria.requiredLabs)}.`,
    )
  }
  if (criteria.quantityLimit) {
    reasons.push(
      `A quantity limit applies; doses above the plan threshold need justification.`,
    )
  }

  return {
    required: true,
    reasons,
    summary: criteria.criteriaSummary,
  }
}

// ---------------------------------------------------------------------------
// DTR: Documentation Templates & Rules
// ---------------------------------------------------------------------------

export type DocSpec = {
  label: string
  source: DocSource
  satisfied: boolean
  evidence?: string
}

export type DtrInput = {
  drugName: string
  criteria: RuleCriteria
  chart: PatientChart
  memberId: string
  providerName: string
  providerNpi: string
  hasLetterOfMedicalNecessity?: boolean
}

export function buildRequiredDocuments(input: DtrInput): DocSpec[] {
  const { criteria, chart, memberId, providerName, providerNpi } = input
  const docs: DocSpec[] = []

  docs.push({
    label: "Plan member ID and eligibility",
    source: "Chart",
    satisfied: Boolean(memberId),
    evidence: memberId ? `Member ${memberId}` : undefined,
  })

  docs.push({
    label: "Prescriber NPI and attestation",
    source: "Provider",
    satisfied: Boolean(providerNpi),
    evidence: providerNpi ? `${providerName}, NPI ${providerNpi}` : undefined,
  })

  if (criteria.requiredDiagnoses.length > 0) {
    const match = matchDiagnosis(chart, criteria.requiredDiagnoses)
    docs.push({
      label: "Qualifying diagnosis on file",
      source: "Chart",
      satisfied: Boolean(match),
      evidence: match ? `${match.code} ${match.label}` : undefined,
    })
  }

  if (criteria.stepTherapyRequired || criteria.requiredPriorTherapies.length > 0) {
    const match = matchStepTherapy(chart, criteria.requiredPriorTherapies)
    docs.push({
      label: "Step therapy: trial of a preferred agent",
      source: "Chart",
      satisfied: Boolean(match),
      evidence: match ? `${match.name} (${match.outcome})` : undefined,
    })
  }

  for (const lab of criteria.requiredLabs) {
    const match = matchLab(chart, lab)
    docs.push({
      label: `Recent ${lab}`,
      source: "Lab",
      satisfied: Boolean(match),
      evidence: match
        ? `${match.name}: ${match.value}${match.unit ? ` ${match.unit}` : ""} (${match.date})`
        : undefined,
    })
  }

  docs.push({
    label: "Letter of medical necessity",
    source: "Provider",
    satisfied: Boolean(input.hasLetterOfMedicalNecessity),
    evidence: input.hasLetterOfMedicalNecessity
      ? "Drafted for clinician review"
      : undefined,
  })

  return docs
}

export type ReadinessResult = {
  total: number
  satisfied: number
  missing: DocSpec[]
  allSatisfied: boolean
  completeness: number
  status: Extract<PaStatus, "NeedsDocumentation" | "ReadyToSubmit">
}

export function assessReadiness(docs: DocSpec[]): ReadinessResult {
  const total = docs.length
  const satisfied = docs.filter((d) => d.satisfied).length
  const missing = docs.filter((d) => !d.satisfied)
  const allSatisfied = missing.length === 0
  return {
    total,
    satisfied,
    missing,
    allSatisfied,
    completeness: total === 0 ? 1 : satisfied / total,
    status: allSatisfied ? "ReadyToSubmit" : "NeedsDocumentation",
  }
}

// ---------------------------------------------------------------------------
// PAS: Prior Authorization Support (deterministic decision)
// ---------------------------------------------------------------------------

export type PasDecision = "Approved" | "Denied" | "NeedsInfo"

export type PasResult = {
  decision: PasDecision
  reason: string
}

export function decidePriorAuth(input: DtrInput): PasResult {
  const { drugName } = input
  const docs = buildRequiredDocuments(input)

  const dxDoc = docs.find((d) => d.label.startsWith("Qualifying diagnosis"))
  if (dxDoc && !dxDoc.satisfied) {
    return {
      decision: "Denied",
      reason: `The documented diagnosis is not on the plan's approved indication list for ${drugName}.`,
    }
  }

  const stepDoc = docs.find((d) => d.label.startsWith("Step therapy"))
  if (stepDoc && !stepDoc.satisfied) {
    return {
      decision: "Denied",
      reason: `Step therapy requirement not met: the plan requires a documented trial and failure of a preferred agent before ${drugName}.`,
    }
  }

  const missingLabs = docs.filter(
    (d) => d.label.startsWith("Recent ") && !d.satisfied,
  )
  if (missingLabs.length > 0) {
    return {
      decision: "NeedsInfo",
      reason: `Additional information required before a decision: ${displayList(
        missingLabs.map((d) => d.label.replace(/^Recent /, "")),
      )}.`,
    }
  }

  return {
    decision: "Approved",
    reason: `All plan criteria are satisfied and supporting documentation is on file for ${drugName}.`,
  }
}
