import type { PaDetail } from "@/lib/data/pa"

export type LomnData = {
  patientName: string
  age: number
  sex: string
  diagnosisCode: string
  diagnosisLabel: string
  drugName: string
  brandName: string | null
  drugClass: string
  planName: string
  providerName: string
  providerSpecialty: string
  priorTherapies: { name: string; outcome: string }[]
  labs: { name: string; value: string }[]
  criteriaSummary: string
}

export function lomnDataFromPa(pa: PaDetail): LomnData {
  return {
    patientName: pa.patient.name,
    age: pa.patient.age,
    sex: pa.patient.sex,
    diagnosisCode: pa.diagnosisCode,
    diagnosisLabel: pa.diagnosisLabel,
    drugName: pa.medication.name,
    brandName: pa.medication.brandName,
    drugClass: pa.medication.drugClass,
    planName: pa.payer.name,
    providerName: pa.provider.name,
    providerSpecialty: pa.provider.specialty,
    priorTherapies: pa.patient.chart.priorTherapies.map((t) => ({
      name: t.name,
      outcome: t.outcome,
    })),
    labs: pa.patient.chart.labs.map((l) => ({
      name: l.name,
      value: `${l.value}${l.unit ? ` ${l.unit}` : ""}`,
    })),
    criteriaSummary: pa.coverage.summary,
  }
}

export const LOMN_SYSTEM = [
  "You are a clinical documentation specialist drafting a Letter of Medical Necessity for a prior authorization request.",
  "Write in a professional clinical register, addressed to the payer's utilization management department.",
  "Cite the diagnosis, the prior therapies tried and their outcomes, any relevant recent labs, and a clear medical rationale that ties the request to the plan's published criteria.",
  "Keep it concise, roughly 250 to 400 words, in three or four short paragraphs.",
  "Do not invent clinical facts beyond those provided. Use only the synthetic data given.",
  "Close with a clear statement that this letter is a draft prepared for clinician review and must be reviewed and signed before submission.",
  "Do not use em dashes or en dashes anywhere; use commas, periods, or parentheses instead.",
].join(" ")

export function lomnUserMessage(d: LomnData): string {
  const trials =
    d.priorTherapies.length > 0
      ? d.priorTherapies.map((t) => `${t.name} (${t.outcome})`).join(", ")
      : "none documented"
  const labs =
    d.labs.length > 0
      ? d.labs.map((l) => `${l.name}: ${l.value}`).join("; ")
      : "none on file"

  return [
    "Draft a Letter of Medical Necessity from the following case. All data is synthetic.",
    "",
    `Patient: ${d.patientName}, ${d.age} year old ${d.sex.toLowerCase()}`,
    `Diagnosis: ${d.diagnosisCode} ${d.diagnosisLabel}`,
    `Requested therapy: ${d.drugName}${d.brandName ? ` (${d.brandName})` : ""}, ${d.drugClass}`,
    `Plan: ${d.planName}`,
    `Prescriber: ${d.providerName}, ${d.providerSpecialty}`,
    `Prior therapies tried: ${trials}`,
    `Recent labs: ${labs}`,
    `Plan criteria: ${d.criteriaSummary}`,
  ].join("\n")
}

/** Deterministic fallback used when no API key is configured. */
export function buildFallbackLetter(d: LomnData): string {
  const firstName = d.patientName.split(" ")[0]
  const failedTrial = d.priorTherapies.find((t) =>
    ["failed", "intolerant", "partial"].includes(t.outcome),
  )
  const trialSentence = failedTrial
    ? `${firstName} previously completed a trial of ${failedTrial.name}, which was ${failedTrial.outcome}. Disease activity has continued despite this therapy.`
    : `First-line management has not produced adequate disease control for ${firstName}.`
  const labSentence =
    d.labs.length > 0
      ? `Recent results support the request, including ${d.labs
          .slice(0, 3)
          .map((l) => `${l.name} of ${l.value}`)
          .join(", ")}.`
      : "Supporting clinical data is documented in the chart."

  return [
    `To the Utilization Management Department at ${d.planName}:`,
    "",
    `I am writing to document the medical necessity of ${d.drugName}${
      d.brandName ? ` (${d.brandName})` : ""
    } for my patient, ${d.patientName}, a ${d.age} year old ${d.sex.toLowerCase()} with a diagnosis of ${d.diagnosisLabel} (${d.diagnosisCode}).`,
    "",
    `${trialSentence} ${labSentence}`,
    "",
    `In my clinical judgment as a ${d.providerSpecialty} specialist, ${d.drugName} is the most appropriate next step and is consistent with accepted guidelines and the plan's published criteria: ${d.criteriaSummary} I respectfully request approval of this prior authorization so that ${firstName} can begin therapy without further delay.`,
    "",
    "Sincerely,",
    `${d.providerName}, ${d.providerSpecialty}`,
    "",
    "This letter is a draft prepared for clinician review. It is generated from synthetic data and must be reviewed and signed by the treating clinician before submission.",
  ].join("\n")
}
