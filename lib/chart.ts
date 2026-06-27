import type {
  Diagnosis,
  LabResult,
  PatientChart,
  PriorTherapy,
} from "@/types"

/** Safely parse a JSON-encoded array column, returning [] on any malformed input. */
export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

/**
 * Parse a JSON-encoded array, keeping only string elements. Used for payer
 * criteria (diagnosis codes, therapy names, lab labels) so a malformed value in
 * the column can never feed a non-string into the rules engine matchers.
 */
export function parseStringArray(raw: string | null | undefined): string[] {
  return parseJsonArray<unknown>(raw).filter(
    (v): v is string => typeof v === "string",
  )
}

export const parseDiagnoses = (raw: string | null | undefined): Diagnosis[] =>
  parseJsonArray<Diagnosis>(raw)

export const parsePriorTherapies = (
  raw: string | null | undefined,
): PriorTherapy[] => parseJsonArray<PriorTherapy>(raw)

export const parseLabs = (raw: string | null | undefined): LabResult[] =>
  parseJsonArray<LabResult>(raw)

export function parsePatientChart(patient: {
  diagnoses: string
  priorTherapies: string
  labs: string
}): PatientChart {
  return {
    diagnoses: parseDiagnoses(patient.diagnoses),
    priorTherapies: parsePriorTherapies(patient.priorTherapies),
    labs: parseLabs(patient.labs),
  }
}

export const serializeJson = (value: unknown): string => JSON.stringify(value)
