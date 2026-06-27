import {
  addWeeks,
  eachWeekOfInterval,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"

import { prisma } from "@/lib/prisma"
import { PA_STATUSES, STATUS_META, isDecided } from "@/lib/status"
import { getDeadlineInfo } from "@/lib/deadline"
import { formatRelative } from "@/lib/format"
import {
  toWorklistRow,
  worklistInclude,
  type WorklistRow,
} from "@/lib/data/worklist"

export type Trend = {
  direction: "up" | "down" | "flat"
  delta: string
  tone: "positive" | "negative" | "neutral"
}

export type ActivityItem = {
  id: string
  paId: string
  referenceId: string
  patientName: string
  toStatus: string
  note: string | null
  label: string
}

export type DashboardData = {
  kpis: {
    pending: number
    pendingTrend: Trend
    approvedThisMonth: number
    approvedTrend: Trend
    avgTurnaroundHours: number | null
    turnaroundTrend: Trend
    atRisk: number
    overdue: number
    approvalRate: number
    approvalRateTrend: Trend
    totalActive: number
  }
  volume: { label: string; count: number }[]
  statusBreakdown: { key: string; label: string; value: number; hex: string }[]
  turnaroundByPayer: { payer: string; hours: number }[]
  approvalTrend: { label: string; rate: number }[]
  atRiskRows: WorklistRow[]
  activity: ActivityItem[]
}

function mean(xs: number[]): number | null {
  if (xs.length === 0) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function trend(
  curr: number | null,
  prev: number | null,
  better: "higher" | "lower",
  format: (n: number) => string,
): Trend {
  if (curr === null || prev === null) {
    return { direction: "flat", delta: "No prior period", tone: "neutral" }
  }
  const diff = curr - prev
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat"
  const tone =
    diff === 0
      ? "neutral"
      : better === "higher"
        ? diff > 0
          ? "positive"
          : "negative"
        : diff < 0
          ? "positive"
          : "negative"
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : ""
  return { direction, delta: `${sign}${format(Math.abs(diff))}`, tone }
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()

  const requests = await prisma.priorAuthRequest.findMany({
    select: {
      status: true,
      createdAt: true,
      decisionAt: true,
      deadline: true,
      turnaroundHours: true,
      payer: { select: { name: true } },
    },
  })

  const decided = requests.filter((r) => isDecided(r.status))
  const approved = requests.filter((r) => r.status === "Approved")
  const denied = requests.filter((r) => r.status === "Denied")

  // Pending workload
  const pending = requests.filter(
    (r) => !isDecided(r.status) && r.status !== "Draft",
  ).length
  const inflowThisWeek = requests.filter(
    (r) => r.createdAt >= subDays(now, 7),
  ).length
  const inflowPrevWeek = requests.filter(
    (r) => r.createdAt >= subDays(now, 14) && r.createdAt < subDays(now, 7),
  ).length
  const pendingTrend: Trend = {
    ...trend(inflowThisWeek, inflowPrevWeek, "higher", (n) => `${Math.round(n)}`),
    tone: "neutral",
    delta: `${inflowThisWeek - inflowPrevWeek >= 0 ? "+" : ""}${inflowThisWeek - inflowPrevWeek} new this week`,
  }

  // Approved this month
  const monthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const approvedThisMonth = approved.filter(
    (r) => r.decisionAt && r.decisionAt >= monthStart,
  ).length
  const approvedLastMonth = approved.filter(
    (r) =>
      r.decisionAt &&
      r.decisionAt >= lastMonthStart &&
      r.decisionAt < monthStart,
  ).length
  const approvedTrend = trend(
    approvedThisMonth,
    approvedLastMonth,
    "higher",
    (n) => `${Math.round(n)} vs last month`,
  )

  // Turnaround
  const turnOf = (list: typeof requests) =>
    mean(
      list
        .map((r) => r.turnaroundHours)
        .filter((x): x is number => x !== null && x !== undefined),
    )
  const last30 = decided.filter((r) => r.decisionAt && r.decisionAt >= subDays(now, 30))
  const prev30 = decided.filter(
    (r) =>
      r.decisionAt &&
      r.decisionAt >= subDays(now, 60) &&
      r.decisionAt < subDays(now, 30),
  )
  const avgTurnaroundHours = turnOf(last30) ?? turnOf(decided)
  const turnaroundTrend = trend(
    turnOf(last30),
    turnOf(prev30),
    "lower",
    (n) => `${Math.round(n)}h`,
  )

  // At risk
  const open = requests.filter((r) => !isDecided(r.status))
  let atRisk = 0
  let overdue = 0
  for (const r of open) {
    const state = getDeadlineInfo(r.deadline, false).state
    if (state === "overdue") {
      overdue++
      atRisk++
    } else if (state === "atRisk") {
      atRisk++
    }
  }

  // Approval rate
  const approvalRate =
    approved.length + denied.length > 0
      ? (approved.length / (approved.length + denied.length)) * 100
      : 0
  const rateOf = (list: typeof requests) => {
    const a = list.filter((r) => r.status === "Approved").length
    const d = list.filter((r) => r.status === "Denied").length
    return a + d > 0 ? (a / (a + d)) * 100 : null
  }
  const approvalRateTrend = trend(
    rateOf(last30),
    rateOf(prev30),
    "higher",
    (n) => `${Math.round(n)} pts`,
  )

  // Volume (weekly, 13 weeks)
  const volWeeks = eachWeekOfInterval({
    start: startOfWeek(subWeeks(now, 12)),
    end: now,
  })
  const volume = volWeeks.map((w) => {
    const next = addWeeks(w, 1)
    return {
      label: format(w, "MMM d"),
      count: requests.filter((r) => r.createdAt >= w && r.createdAt < next).length,
    }
  })

  // Status breakdown
  const statusBreakdown = PA_STATUSES.map((s) => ({
    key: s,
    label: STATUS_META[s].label,
    value: requests.filter((r) => r.status === s).length,
    hex: STATUS_META[s].hex,
  })).filter((d) => d.value > 0)

  // Turnaround by payer
  const payerNames = Array.from(new Set(requests.map((r) => r.payer.name)))
  const turnaroundByPayer = payerNames
    .map((name) => {
      const hours = turnOf(decided.filter((r) => r.payer.name === name))
      return { payer: name, hours: hours ? Math.round(hours) : 0 }
    })
    .filter((d) => d.hours > 0)
    .sort((a, b) => a.hours - b.hours)

  // Approval rate trend (weekly, carry forward)
  const trendWeeks = eachWeekOfInterval({
    start: startOfWeek(subWeeks(now, 9)),
    end: now,
  })
  const rawRates = trendWeeks.map((w) => {
    const next = addWeeks(w, 1)
    const wk = decided.filter(
      (r) => r.decisionAt && r.decisionAt >= w && r.decisionAt < next,
    )
    const a = wk.filter((r) => r.status === "Approved").length
    const d = wk.filter((r) => r.status === "Denied").length
    return {
      label: format(w, "MMM d"),
      rate: a + d > 0 ? Math.round((a / (a + d)) * 100) : null,
    }
  })
  // forward fill, then backfill leading gaps
  let carry: number | null = null
  const filled = rawRates.map((p) => {
    if (p.rate !== null) carry = p.rate
    return { ...p, rate: p.rate ?? carry }
  })
  const firstKnown = filled.find((p) => p.rate !== null)?.rate ?? 0
  const approvalTrendSeries = filled.map((p) => ({
    label: p.label,
    rate: p.rate ?? firstKnown,
  }))

  // At-risk rows
  const openRecords = await prisma.priorAuthRequest.findMany({
    where: { status: { notIn: ["Approved", "Denied"] } },
    include: worklistInclude,
  })
  const atRiskRows = openRecords
    .map(toWorklistRow)
    .filter(
      (r) => r.deadlineState === "atRisk" || r.deadlineState === "overdue",
    )
    .sort((a, b) => (a.hoursLeft ?? 0) - (b.hoursLeft ?? 0))
    .slice(0, 6)

  // Activity feed
  const events = await prisma.statusEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      request: {
        select: {
          id: true,
          referenceId: true,
          patient: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })
  const activity: ActivityItem[] = events.map((e) => ({
    id: e.id,
    paId: e.request.id,
    referenceId: e.request.referenceId,
    patientName: `${e.request.patient.firstName} ${e.request.patient.lastName}`,
    toStatus: e.toStatus,
    note: e.note,
    label: formatRelative(e.createdAt),
  }))

  return {
    kpis: {
      pending,
      pendingTrend,
      approvedThisMonth,
      approvedTrend,
      avgTurnaroundHours,
      turnaroundTrend,
      atRisk,
      overdue,
      approvalRate,
      approvalRateTrend,
      totalActive: open.length,
    },
    volume,
    statusBreakdown,
    turnaroundByPayer,
    approvalTrend: approvalTrendSeries,
    atRiskRows,
    activity,
  }
}
