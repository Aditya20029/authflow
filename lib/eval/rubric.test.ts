import { describe, it, expect } from "vitest"

import { scoreLetter, aggregate, wordCount } from "@/lib/eval/rubric"
import { buildFallbackLetter, type LomnData } from "@/lib/letter"

const DATA: LomnData = {
  patientName: "Jordan Lee",
  age: 54,
  sex: "Female",
  diagnosisCode: "L40.0",
  diagnosisLabel: "Psoriasis vulgaris",
  drugName: "Adalimumab",
  brandName: "Humira",
  drugClass: "TNF inhibitor",
  planName: "Meridian Health Plan",
  providerName: "Dr. Taylor Reed",
  providerSpecialty: "Rheumatology",
  priorTherapies: [{ name: "Methotrexate", outcome: "failed" }],
  labs: [{ name: "QuantiFERON-TB Gold", value: "Negative" }],
  criteriaSummary:
    "Trial of methotrexate, negative TB screening, and a qualifying diagnosis.",
}

function passed(score: ReturnType<typeof scoreLetter>, key: string) {
  return score.criteria.find((c) => c.key === key)?.passed
}

describe("wordCount", () => {
  it("counts words and handles empty input", () => {
    expect(wordCount("")).toBe(0)
    expect(wordCount("   ")).toBe(0)
    expect(wordCount("one two three")).toBe(3)
  })
})

describe("scoreLetter", () => {
  it("scores a well-formed templated letter at or near 100", () => {
    const letter = buildFallbackLetter(DATA)
    const score = scoreLetter(letter, DATA)

    expect(score.score).toBeGreaterThanOrEqual(90)
    expect(passed(score, "diagnosis")).toBe(true)
    expect(passed(score, "drug")).toBe(true)
    expect(passed(score, "priorTherapy")).toBe(true)
    expect(passed(score, "disclaimer")).toBe(true)
    expect(passed(score, "noDashes")).toBe(true)
    expect(passed(score, "addressed")).toBe(true)
  })

  it("flags a poor letter on the right criteria", () => {
    const bad = "Patient needs the drug. Please approve — thanks."
    const score = scoreLetter(bad, DATA)

    expect(score.score).toBeLessThan(30)
    expect(passed(score, "noDashes")).toBe(false)
    expect(passed(score, "disclaimer")).toBe(false)
    expect(passed(score, "length")).toBe(false)
    expect(passed(score, "diagnosis")).toBe(false)
  })

  it("credits first-line language when there is no documented trial", () => {
    const noTrial: LomnData = { ...DATA, priorTherapies: [] }
    const letter = buildFallbackLetter(noTrial)
    expect(passed(scoreLetter(letter, noTrial), "priorTherapy")).toBe(true)
  })
})

describe("aggregate", () => {
  it("summarizes scores and per-criterion pass rates", () => {
    const good = scoreLetter(buildFallbackLetter(DATA), DATA)
    const bad = scoreLetter("too short, has a — dash", DATA)
    const agg = aggregate([good, bad])

    expect(agg.count).toBe(2)
    expect(agg.averageScore).toBeGreaterThan(0)
    expect(agg.criterionPassRate.noDashes).toBe(0.5)
    expect(agg.criterionPassRate.diagnosis).toBe(0.5)
  })

  it("returns zeros for an empty set", () => {
    const agg = aggregate([])
    expect(agg.count).toBe(0)
    expect(agg.averageScore).toBe(0)
  })
})
