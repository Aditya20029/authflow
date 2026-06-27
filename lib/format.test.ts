import { describe, it, expect } from "vitest"

import { formatHours, formatPercent, initials, age } from "@/lib/format"

describe("formatHours", () => {
  it("returns n/a for null or undefined", () => {
    expect(formatHours(null)).toBe("n/a")
    expect(formatHours(undefined)).toBe("n/a")
  })
  it("shows sub-hour durations compactly", () => {
    expect(formatHours(0.5)).toBe("<1h")
  })
  it("shows hours under two days", () => {
    expect(formatHours(30)).toBe("30h")
  })
  it("switches to days at or above 48 hours", () => {
    expect(formatHours(60)).toBe("2.5d")
  })
})

describe("formatPercent", () => {
  it("rounds to whole percent by default", () => {
    expect(formatPercent(73.4)).toBe("73%")
  })
  it("honors a digit count", () => {
    expect(formatPercent(73.4, 1)).toBe("73.4%")
  })
})

describe("initials", () => {
  it("uses first and last initials", () => {
    expect(initials("Alex Rivera")).toBe("AR")
  })
  it("handles a single name", () => {
    expect(initials("Cher")).toBe("CH")
  })
  it("handles empty input", () => {
    expect(initials("   ")).toBe("?")
  })
})

describe("age", () => {
  it("computes whole years from a date of birth", () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 30)
    dob.setDate(dob.getDate() - 1)
    expect(age(dob)).toBe(30)
  })
})
