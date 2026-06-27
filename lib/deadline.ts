import { differenceInHours, formatDistanceToNowStrict } from "date-fns"

export type DeadlineState = "overdue" | "atRisk" | "onTrack" | "none"

export type DeadlineInfo = {
  state: DeadlineState
  label: string
  hoursLeft: number | null
}

/**
 * Classifies time-to-deadline for the urgency treatment used across the
 * worklist, dashboard, and detail views. At-risk is within 48 hours; overdue is
 * any deadline already passed. Decided requests have no live clock.
 */
export function getDeadlineInfo(
  deadline: Date | string | null | undefined,
  decided = false,
): DeadlineInfo {
  if (decided) return { state: "none", label: "Decided", hoursLeft: null }
  if (!deadline) return { state: "none", label: "No deadline", hoursLeft: null }

  const d = typeof deadline === "string" ? new Date(deadline) : deadline
  const now = new Date()
  const hours = differenceInHours(d, now)
  const rel = formatDistanceToNowStrict(d)

  if (d.getTime() < now.getTime()) {
    return { state: "overdue", label: `Overdue by ${rel}`, hoursLeft: hours }
  }
  return {
    state: hours <= 48 ? "atRisk" : "onTrack",
    label: `Due in ${rel}`,
    hoursLeft: hours,
  }
}

export function isAtRiskOrOverdue(state: DeadlineState): boolean {
  return state === "atRisk" || state === "overdue"
}
