import { describe, it, expect } from "vitest"

import { getDeadlineInfo, isAtRiskOrOverdue } from "@/lib/deadline"

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600 * 1000)

describe("getDeadlineInfo", () => {
  it("returns none for decided requests", () => {
    expect(getDeadlineInfo(hoursFromNow(10), true).state).toBe("none")
  })
  it("returns none when there is no deadline", () => {
    expect(getDeadlineInfo(null).state).toBe("none")
  })
  it("flags overdue when the deadline has passed", () => {
    const info = getDeadlineInfo(hoursFromNow(-5))
    expect(info.state).toBe("overdue")
    expect(info.label).toContain("Overdue")
  })
  it("flags at-risk within 48 hours", () => {
    expect(getDeadlineInfo(hoursFromNow(20)).state).toBe("atRisk")
  })
  it("is on track beyond 48 hours", () => {
    expect(getDeadlineInfo(hoursFromNow(120)).state).toBe("onTrack")
  })
  it("accepts ISO date strings", () => {
    expect(getDeadlineInfo(hoursFromNow(10).toISOString()).state).toBe("atRisk")
  })
})

describe("isAtRiskOrOverdue", () => {
  it("is true only for atRisk and overdue", () => {
    expect(isAtRiskOrOverdue("overdue")).toBe(true)
    expect(isAtRiskOrOverdue("atRisk")).toBe(true)
    expect(isAtRiskOrOverdue("onTrack")).toBe(false)
    expect(isAtRiskOrOverdue("none")).toBe(false)
  })
})
