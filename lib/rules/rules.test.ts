import { describe, it, expect } from "vitest"

import {
  evaluateCoverage,
  buildRequiredDocuments,
  assessReadiness,
  decidePriorAuth,
  matchDiagnosis,
  matchStepTherapy,
  matchLab,
  displayList,
  type DtrInput,
} from "@/lib/rules"
import type { PatientChart, RuleCriteria } from "@/types"

const HUMIRA_CRITERIA: RuleCriteria = {
  paRequired: true,
  stepTherapyRequired: true,
  requiredDiagnoses: ["L40"],
  requiredPriorTherapies: ["methotrexate"],
  requiredLabs: ["TB screening"],
  quantityLimit: false,
  criteriaSummary:
    "Trial of methotrexate, negative TB screening, and a qualifying diagnosis.",
}

const completeChart: PatientChart = {
  diagnoses: [{ code: "L40.0", label: "Psoriasis vulgaris" }],
  priorTherapies: [
    { name: "Methotrexate", drugClass: "Conventional DMARD", outcome: "failed" },
  ],
  labs: [{ name: "QuantiFERON-TB Gold", value: "Negative", date: "2026-05-01" }],
}

function dtr(
  chart: PatientChart,
  overrides: Partial<DtrInput> = {},
): DtrInput {
  return {
    drugName: "Adalimumab",
    criteria: HUMIRA_CRITERIA,
    chart,
    memberId: "ABC123456789",
    providerName: "Dr. Taylor Reed",
    providerNpi: "1234567890",
    hasLetterOfMedicalNecessity: true,
    ...overrides,
  }
}

describe("evaluateCoverage (CRD)", () => {
  it("flags a required prior authorization with payer-specific reasons", () => {
    const result = evaluateCoverage({
      planName: "Meridian Health Plan",
      drugName: "Adalimumab",
      drugClass: "TNF inhibitor",
      isSpecialty: true,
      criteria: HUMIRA_CRITERIA,
    })

    expect(result.required).toBe(true)
    // Base reason, specialty, step therapy, indication, and labs.
    expect(result.reasons.length).toBeGreaterThanOrEqual(4)
    expect(result.reasons.join(" ")).toMatch(/step therapy/i)
    expect(result.summary).toBe(HUMIRA_CRITERIA.criteriaSummary)
  })

  it("returns not-required when there is no rule", () => {
    const result = evaluateCoverage({
      planName: "Meridian Health Plan",
      drugName: "Lisinopril",
      drugClass: "ACE inhibitor",
      isSpecialty: false,
      criteria: null,
    })

    expect(result.required).toBe(false)
    expect(result.reasons).toHaveLength(1)
    expect(result.reasons[0]).toContain("does not require prior authorization")
  })

  it("returns not-required when the rule does not gate the drug", () => {
    const result = evaluateCoverage({
      planName: "BluePeak Insurance",
      drugName: "Atorvastatin",
      drugClass: "Statin",
      isSpecialty: false,
      criteria: { ...HUMIRA_CRITERIA, paRequired: false },
    })

    expect(result.required).toBe(false)
  })
})

describe("buildRequiredDocuments + assessReadiness (DTR)", () => {
  it("auto-satisfies every item from a complete chart", () => {
    const docs = buildRequiredDocuments(dtr(completeChart))
    const readiness = assessReadiness(docs)

    expect(readiness.allSatisfied).toBe(true)
    expect(readiness.status).toBe("ReadyToSubmit")
    expect(readiness.completeness).toBe(1)
    // The qualifying diagnosis carries its evidence forward.
    const dx = docs.find((d) => d.label.startsWith("Qualifying diagnosis"))
    expect(dx?.evidence).toContain("L40.0")
  })

  it("flags missing documentation when the step therapy trial is absent", () => {
    const chart: PatientChart = { ...completeChart, priorTherapies: [] }
    const docs = buildRequiredDocuments(dtr(chart))
    const readiness = assessReadiness(docs)

    expect(readiness.allSatisfied).toBe(false)
    expect(readiness.status).toBe("NeedsDocumentation")
    const step = readiness.missing.find((d) => d.label.startsWith("Step therapy"))
    expect(step).toBeDefined()
    expect(step?.satisfied).toBe(false)
  })

  it("counts the letter of medical necessity as missing until drafted", () => {
    const docs = buildRequiredDocuments(
      dtr(completeChart, { hasLetterOfMedicalNecessity: false }),
    )
    const lomn = docs.find((d) => d.label === "Letter of medical necessity")
    expect(lomn?.satisfied).toBe(false)
    expect(assessReadiness(docs).allSatisfied).toBe(false)
  })
})

describe("decidePriorAuth (PAS)", () => {
  it("approves when every criterion is met", () => {
    expect(decidePriorAuth(dtr(completeChart)).decision).toBe("Approved")
  })

  it("denies when step therapy is not documented", () => {
    const chart: PatientChart = { ...completeChart, priorTherapies: [] }
    const result = decidePriorAuth(dtr(chart))
    expect(result.decision).toBe("Denied")
    expect(result.reason).toContain("Step therapy")
  })

  it("denies when the diagnosis is not on the approved list", () => {
    const chart: PatientChart = {
      ...completeChart,
      diagnoses: [{ code: "I10", label: "Essential hypertension" }],
    }
    expect(decidePriorAuth(dtr(chart)).decision).toBe("Denied")
  })

  it("asks for more information when only a lab is missing", () => {
    const chart: PatientChart = { ...completeChart, labs: [] }
    const result = decidePriorAuth(dtr(chart))
    expect(result.decision).toBe("NeedsInfo")
    expect(result.reason).toContain("TB screening")
  })
})

describe("matching helpers", () => {
  it("matches diagnosis codes by family prefix", () => {
    expect(matchDiagnosis(completeChart, ["L40"])).not.toBeNull()
    expect(matchDiagnosis(completeChart, ["M06"])).toBeNull()
  })

  it("only counts a real trial as step therapy", () => {
    const ongoing: PatientChart = {
      ...completeChart,
      priorTherapies: [
        { name: "Ibuprofen", drugClass: "NSAID", outcome: "ongoing" },
      ],
    }
    expect(matchStepTherapy(ongoing, ["methotrexate"])).toBeNull()
    expect(matchStepTherapy(completeChart, ["methotrexate"])).not.toBeNull()
  })

  it("matches labs by token overlap", () => {
    expect(matchLab(completeChart, "TB screening")).not.toBeNull()
    expect(matchLab(completeChart, "HbA1c")).toBeNull()
  })
})

describe("displayList", () => {
  it("formats lists as readable prose", () => {
    expect(displayList(["A"])).toBe("A")
    expect(displayList(["A", "B"])).toBe("A and B")
    expect(displayList(["A", "B", "C"])).toBe("A, B, and C")
  })
})

describe("coverage reasons", () => {
  it("includes specialty, indication, and lab reasons", () => {
    const r = evaluateCoverage({
      planName: "Meridian Health Plan",
      drugName: "Adalimumab",
      drugClass: "TNF inhibitor",
      isSpecialty: true,
      criteria: HUMIRA_CRITERIA,
    })
    const joined = r.reasons.join(" ")
    expect(joined).toMatch(/specialty or biologic/i)
    expect(joined).toContain("L40")
    expect(joined).toContain("TB screening")
  })

  it("surfaces a quantity limit when the rule sets one", () => {
    const r = evaluateCoverage({
      planName: "Meridian Health Plan",
      drugName: "Semaglutide",
      drugClass: "GLP-1 receptor agonist",
      isSpecialty: true,
      criteria: { ...HUMIRA_CRITERIA, quantityLimit: true },
    })
    expect(r.reasons.join(" ")).toMatch(/quantity limit/i)
  })
})

describe("required documents shape", () => {
  it("always includes member ID, prescriber, and the letter", () => {
    const labels = buildRequiredDocuments(dtr(completeChart)).map((d) => d.label)
    expect(labels).toContain("Plan member ID and eligibility")
    expect(labels).toContain("Prescriber NPI and attestation")
    expect(labels).toContain("Letter of medical necessity")
  })

  it("marks member ID unsatisfied when it is missing", () => {
    const docs = buildRequiredDocuments(dtr(completeChart, { memberId: "" }))
    expect(
      docs.find((d) => d.label.startsWith("Plan member ID"))?.satisfied,
    ).toBe(false)
  })

  it("adds one document per required lab", () => {
    const docs = buildRequiredDocuments(dtr(completeChart))
    expect(docs.filter((d) => d.label.startsWith("Recent ")).length).toBe(
      HUMIRA_CRITERIA.requiredLabs.length,
    )
  })
})

describe("readiness completeness", () => {
  it("reports a fractional completeness and a consistent split", () => {
    const chart: PatientChart = { ...completeChart, priorTherapies: [] }
    const readiness = assessReadiness(buildRequiredDocuments(dtr(chart)))
    expect(readiness.completeness).toBeGreaterThan(0)
    expect(readiness.completeness).toBeLessThan(1)
    expect(readiness.satisfied + readiness.missing.length).toBe(readiness.total)
  })
})

describe("matchLab multi-token", () => {
  it("matches a multi-word lab label against the chart", () => {
    const chart: PatientChart = {
      diagnoses: [],
      priorTherapies: [],
      labs: [
        { name: "Hepatitis B surface antigen", value: "Non-reactive", date: "2026-05-01" },
      ],
    }
    expect(matchLab(chart, "Hepatitis B panel")).not.toBeNull()
  })
})
