// Evaluation rubric for the AI-drafted Letter of Medical Necessity.
//
// Deterministic, dependency free, and unit tested. It scores a letter against
// the structured case it was generated from, the same idea as an LLM-as-judge
// rubric but computed with explicit checks so it runs with no API key and gives
// reproducible numbers. An optional Claude judge (in eval/run.ts) layers a
// qualitative score on top when a key is present.

import type { LomnData } from "@/lib/letter"

const EM_EN_DASH = /[—–]/

const ci = (haystack: string, needle: string) =>
  needle.length > 0 && haystack.toLowerCase().includes(needle.toLowerCase())

export function wordCount(text: string): number {
  const t = text.trim()
  return t.length === 0 ? 0 : t.split(/\s+/).length
}

export type RubricCriterion = {
  key: string
  label: string
  weight: number
  test: (letter: string, data: LomnData) => boolean
}

export const RUBRIC: RubricCriterion[] = [
  {
    key: "addressed",
    label: "Addressed to the payer's utilization management",
    weight: 1,
    test: (t, d) => /utilization management/i.test(t) || ci(t, d.planName),
  },
  {
    key: "diagnosis",
    label: "Cites the diagnosis",
    weight: 2,
    test: (t, d) => ci(t, d.diagnosisLabel) || t.includes(d.diagnosisCode),
  },
  {
    key: "drug",
    label: "Names the requested therapy",
    weight: 1,
    test: (t, d) => ci(t, d.drugName) || (d.brandName ? ci(t, d.brandName) : false),
  },
  {
    key: "priorTherapy",
    label: "References prior therapy or first-line management",
    weight: 2,
    test: (t, d) => {
      const trial = d.priorTherapies.find((p) =>
        ["failed", "intolerant", "partial"].includes(p.outcome),
      )
      if (trial) return ci(t, trial.name)
      return /first-line|prior therap|previously|not controlled/i.test(t)
    },
  },
  {
    key: "criteria",
    label: "Ties the request to plan criteria or medical necessity",
    weight: 1,
    test: (t) => /criteria|guideline|medically necessary|medical necessity/i.test(t),
  },
  {
    key: "disclaimer",
    label: "Includes the clinician-review draft disclaimer",
    weight: 2,
    test: (t) => /draft/i.test(t) && /review|sign/i.test(t),
  },
  {
    key: "length",
    label: "Within 120 to 500 words",
    weight: 1,
    test: (t) => {
      const w = wordCount(t)
      return w >= 120 && w <= 500
    },
  },
  {
    key: "noDashes",
    label: "No em or en dashes",
    weight: 1,
    test: (t) => !EM_EN_DASH.test(t),
  },
]

export type CriterionResult = {
  key: string
  label: string
  weight: number
  passed: boolean
}

export type LetterScore = {
  criteria: CriterionResult[]
  passedCount: number
  total: number
  /** Weighted adherence score, 0 to 100. */
  score: number
  words: number
}

export function scoreLetter(letter: string, data: LomnData): LetterScore {
  const criteria = RUBRIC.map((c) => ({
    key: c.key,
    label: c.label,
    weight: c.weight,
    passed: Boolean(c.test(letter, data)),
  }))
  const totalWeight = RUBRIC.reduce((a, c) => a + c.weight, 0)
  const earned = criteria.reduce((a, c) => a + (c.passed ? c.weight : 0), 0)
  return {
    criteria,
    passedCount: criteria.filter((c) => c.passed).length,
    total: criteria.length,
    score: Math.round((earned / totalWeight) * 100),
    words: wordCount(letter),
  }
}

export type AggregateReport = {
  count: number
  averageScore: number
  averageWords: number
  /** Pass rate per criterion, 0 to 1, keyed by criterion key. */
  criterionPassRate: Record<string, number>
}

export function aggregate(scores: LetterScore[]): AggregateReport {
  const count = scores.length
  if (count === 0) {
    return { count: 0, averageScore: 0, averageWords: 0, criterionPassRate: {} }
  }
  const criterionPassRate: Record<string, number> = {}
  for (const c of RUBRIC) {
    const passes = scores.filter(
      (s) => s.criteria.find((r) => r.key === c.key)?.passed,
    ).length
    criterionPassRate[c.key] = Math.round((passes / count) * 100) / 100
  }
  return {
    count,
    averageScore: Math.round(scores.reduce((a, s) => a + s.score, 0) / count),
    averageWords: Math.round(scores.reduce((a, s) => a + s.words, 0) / count),
    criterionPassRate,
  }
}
