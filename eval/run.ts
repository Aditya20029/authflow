/**
 * Letter of Medical Necessity evaluation harness.
 *
 * Generates a letter for every seeded request (using the deterministic, keyless
 * template so the harness is reproducible with no API key), scores each letter
 * against the rubric in lib/eval/rubric.ts, and writes an aggregate report.
 *
 * When ANTHROPIC_API_KEY is set, it also runs an LLM-as-judge pass over a small
 * sample, scoring clinical quality 1 to 5, the same eval-driven pattern used to
 * compare and select models in production.
 *
 *   npm run eval
 */

import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

import { PrismaClient } from "@prisma/client"
import { buildFallbackLetter, type LomnData } from "../lib/letter"
import { parsePatientChart } from "../lib/chart"
import { scoreLetter, aggregate, RUBRIC, type LetterScore } from "../lib/eval/rubric"

const prisma = new PrismaClient()

function age(dob: Date): number {
  const now = new Date()
  let a = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--
  return a
}

async function judgeWithClaude(
  letter: string,
  data: LomnData,
): Promise<{ score: number; rationale: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const client = new Anthropic({ apiKey })
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8"

  const res = await client.messages.create({
    model,
    max_tokens: 300,
    system:
      "You are a utilization-management reviewer grading a Letter of Medical Necessity for clinical quality, completeness, and professional tone. Respond with ONLY a JSON object: {\"score\": <integer 1-5>, \"rationale\": \"<one sentence>\"}.",
    messages: [
      {
        role: "user",
        content: `Case: ${data.diagnosisLabel} treated with ${data.drugName} under ${data.planName}.\n\nLetter:\n${letter}`,
      },
    ],
  })
  const text = res.content.find((b) => b.type === "text")
  const raw = text && text.type === "text" ? text.text : ""
  const match = raw.match(/\{[\s\S]*?\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0]) as { score: unknown; rationale: unknown }
    const score = Number(parsed.score)
    if (!Number.isFinite(score) || score < 1 || score > 5) return null
    const rationale =
      typeof parsed.rationale === "string" ? parsed.rationale : ""
    return { score, rationale }
  } catch {
    return null
  }
}

async function main() {
  const requests = await prisma.priorAuthRequest.findMany({
    include: { patient: true, provider: true, medication: true, payer: true },
    orderBy: { referenceId: "asc" },
  })
  const rules = await prisma.payerRule.findMany()
  const ruleByKey = new Map(
    rules.map((r) => [`${r.payerId}:${r.medicationId}`, r]),
  )

  const judgeSampleSize = process.env.ANTHROPIC_API_KEY ? 5 : 0
  let judged = 0
  let judgeTotal = 0

  const perCase = []
  const scores: LetterScore[] = []

  for (const r of requests) {
    const rule = ruleByKey.get(`${r.payerId}:${r.medicationId}`)
    const chart = parsePatientChart(r.patient)
    const data: LomnData = {
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      age: age(r.patient.dateOfBirth),
      sex: r.patient.sex,
      diagnosisCode: r.diagnosisCode,
      diagnosisLabel: r.diagnosisLabel,
      drugName: r.medication.name,
      brandName: r.medication.brandName,
      drugClass: r.medication.drugClass,
      planName: r.payer.name,
      providerName: `Dr. ${r.provider.firstName} ${r.provider.lastName}`,
      providerSpecialty: r.provider.specialty,
      priorTherapies: chart.priorTherapies.map((t) => ({
        name: t.name,
        outcome: t.outcome,
      })),
      labs: chart.labs.map((l) => ({
        name: l.name,
        value: `${l.value}${l.unit ? ` ${l.unit}` : ""}`,
      })),
      criteriaSummary: rule?.criteriaSummary ?? "",
    }

    const letter = buildFallbackLetter(data)
    const score = scoreLetter(letter, data)
    scores.push(score)

    let judge: { score: number; rationale: string } | null = null
    if (judged < judgeSampleSize) {
      judge = await judgeWithClaude(letter, data)
      if (judge) {
        judged++
        judgeTotal += judge.score
      }
    }

    perCase.push({
      referenceId: r.referenceId,
      drug: r.medication.name,
      plan: r.payer.name,
      score: score.score,
      words: score.words,
      failed: score.criteria.filter((c) => !c.passed).map((c) => c.key),
      ...(judge ? { judgeScore: judge.score } : {}),
    })
  }

  const agg = aggregate(scores)
  const report = {
    generatedAt: new Date().toISOString(),
    mode: judged > 0 ? "heuristic + llm-judge" : "heuristic",
    sampleSize: requests.length,
    aggregate: agg,
    llmJudge:
      judged > 0
        ? { sampled: judged, averageScore: Math.round((judgeTotal / judged) * 10) / 10 }
        : null,
    perCase,
  }

  const dir = join(process.cwd(), "eval", "reports")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "latest.json"), JSON.stringify(report, null, 2))

  // Console summary
  console.log("\nLetter of Medical Necessity eval")
  console.log("=================================")
  console.log(`Cases scored:      ${agg.count}`)
  console.log(`Average score:     ${agg.averageScore} / 100`)
  console.log(`Average length:    ${agg.averageWords} words`)
  if (report.llmJudge) {
    console.log(
      `LLM judge (n=${report.llmJudge.sampled}): ${report.llmJudge.averageScore} / 5`,
    )
  }
  console.log("\nCriterion pass rate")
  for (const c of RUBRIC) {
    const rate = Math.round((agg.criterionPassRate[c.key] ?? 0) * 100)
    const bar = "#".repeat(Math.round(rate / 5)).padEnd(20, ".")
    console.log(`  ${bar} ${String(rate).padStart(3)}%  ${c.label}`)
  }
  console.log(`\nReport written to eval/reports/latest.json`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
