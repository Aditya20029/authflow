import { describe, it, expect } from "vitest"

import {
  parseJsonArray,
  parseStringArray,
  parsePatientChart,
  serializeJson,
} from "@/lib/chart"

describe("parseJsonArray", () => {
  it("parses a valid JSON array", () => {
    expect(parseJsonArray<number>("[1,2,3]")).toEqual([1, 2, 3])
  })
  it("returns [] for null, undefined, or empty", () => {
    expect(parseJsonArray(null)).toEqual([])
    expect(parseJsonArray(undefined)).toEqual([])
    expect(parseJsonArray("")).toEqual([])
  })
  it("returns [] for malformed JSON", () => {
    expect(parseJsonArray("{not json")).toEqual([])
  })
  it("returns [] for non-array JSON", () => {
    expect(parseJsonArray('{"a":1}')).toEqual([])
  })
})

describe("parseStringArray", () => {
  it("keeps only string elements", () => {
    expect(parseStringArray('["a", 2, "b", null, {"x":1}]')).toEqual(["a", "b"])
  })
  it("returns [] for malformed input", () => {
    expect(parseStringArray("nope")).toEqual([])
  })
})

describe("parsePatientChart", () => {
  it("parses each chart section", () => {
    const chart = parsePatientChart({
      diagnoses: serializeJson([{ code: "L40.0", label: "Psoriasis vulgaris" }]),
      priorTherapies: serializeJson([
        { name: "Methotrexate", drugClass: "Conventional DMARD", outcome: "failed" },
      ]),
      labs: serializeJson([
        { name: "HbA1c", value: "8.1", unit: "%", date: "2026-05-01" },
      ]),
    })
    expect(chart.diagnoses[0].code).toBe("L40.0")
    expect(chart.priorTherapies[0].outcome).toBe("failed")
    expect(chart.labs[0].name).toBe("HbA1c")
  })
  it("defaults to empty arrays on malformed sections", () => {
    const chart = parsePatientChart({
      diagnoses: "x",
      priorTherapies: "",
      labs: "[]",
    })
    expect(chart.diagnoses).toEqual([])
    expect(chart.priorTherapies).toEqual([])
    expect(chart.labs).toEqual([])
  })
})
