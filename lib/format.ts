import { format, formatDistanceToNowStrict } from "date-fns"

export function formatDate(d: Date | string): string {
  return format(new Date(d), "MMM d, yyyy")
}

export function formatDateTime(d: Date | string): string {
  return format(new Date(d), "MMM d, yyyy 'at' h:mm a")
}

export function formatRelative(d: Date | string): string {
  return `${formatDistanceToNowStrict(new Date(d))} ago`
}

/** Compact human duration for turnaround figures. */
export function formatHours(h: number | null | undefined): string {
  if (h === null || h === undefined) return "n/a"
  if (h < 1) return "<1h"
  if (h < 48) return `${Math.round(h)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function formatPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function age(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let a = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--
  return a
}
