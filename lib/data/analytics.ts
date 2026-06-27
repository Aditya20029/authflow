import { prisma } from "@/lib/prisma"
import { STATUS_META, isDecided, type PaStatus } from "@/lib/status"

const H = 3_600_000

export type AnalyticsData = {
  kpis: {
    total: number
    decided: number
    approvalRate: number
    medianTurnaround: number | null
    avgPrepHours: number | null
    avgReviewHours: number | null
  }
  turnaroundDistribution: { label: string; value: number }[]
  denialReasons: { label: string; value: number }[]
  volumeByDrug: { label: string; value: number }[]
  openByStatus: { label: string; value: number; hex: string }[]
}

function mean(xs: number[]): number | null {
  if (xs.length === 0) return null
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  const v = s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
  return Math.round(v * 10) / 10
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const requests = await prisma.priorAuthRequest.findMany({
    select: {
      status: true,
      createdAt: true,
      submittedAt: true,
      decisionAt: true,
      turnaroundHours: true,
      denialReason: true,
      medication: { select: { name: true } },
    },
  })

  const decided = requests.filter((r) => isDecided(r.status))
  const approved = requests.filter((r) => r.status === "Approved").length
  const denied = requests.filter((r) => r.status === "Denied").length

  const turnarounds = decided
    .map((r) => r.turnaroundHours)
    .filter((x): x is number => x !== null && x !== undefined)

  const prepHours = requests
    .filter((r) => r.submittedAt)
    .map((r) => (r.submittedAt!.getTime() - r.createdAt.getTime()) / H)
    .filter((x) => x >= 0)

  const reviewHours = decided
    .filter((r) => r.submittedAt && r.decisionAt)
    .map((r) => (r.decisionAt!.getTime() - r.submittedAt!.getTime()) / H)
    .filter((x) => x >= 0)

  // Turnaround distribution
  const buckets = [
    { label: "<24h", min: 0, max: 24 },
    { label: "1 to 2d", min: 24, max: 48 },
    { label: "2 to 3d", min: 48, max: 72 },
    { label: "3 to 5d", min: 72, max: 120 },
    { label: "5d+", min: 120, max: Infinity },
  ]
  const turnaroundDistribution = buckets.map((b) => ({
    label: b.label,
    value: turnarounds.filter((h) => h >= b.min && h < b.max).length,
  }))

  // Denial reasons
  const reasonCounts = new Map<string, number>()
  for (const r of requests) {
    if (r.denialReason) {
      reasonCounts.set(r.denialReason, (reasonCounts.get(r.denialReason) ?? 0) + 1)
    }
  }
  const denialReasons = Array.from(reasonCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Volume by drug
  const drugCounts = new Map<string, number>()
  for (const r of requests) {
    drugCounts.set(r.medication.name, (drugCounts.get(r.medication.name) ?? 0) + 1)
  }
  const volumeByDrug = Array.from(drugCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Open requests by status (where work sits)
  const openByStatus = (
    [
      "NeedsDocumentation",
      "ReadyToSubmit",
      "Submitted",
      "InReview",
      "Appealed",
      "Draft",
    ] as PaStatus[]
  )
    .map((s) => ({
      label: STATUS_META[s].label,
      value: requests.filter((r) => r.status === s).length,
      hex: STATUS_META[s].hex,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    kpis: {
      total: requests.length,
      decided: decided.length,
      approvalRate:
        approved + denied > 0 ? (approved / (approved + denied)) * 100 : 0,
      medianTurnaround: median(turnarounds),
      avgPrepHours: mean(prepHours),
      avgReviewHours: mean(reviewHours),
    },
    turnaroundDistribution,
    denialReasons,
    volumeByDrug,
    openByStatus,
  }
}
