import { subDays } from "date-fns"

import { prisma } from "@/lib/prisma"

export type AssistantMetrics = {
  total: number
  last7d: number
  fallbackRate: number
  avgLatencyMs: number | null
  totalOutputTokens: number
  byStatus: { status: string; count: number }[]
}

export async function getAssistantMetrics(): Promise<AssistantMetrics> {
  const logs = await prisma.generationLog.findMany({
    select: {
      usedFallback: true,
      status: true,
      latencyMs: true,
      outputTokens: true,
      createdAt: true,
    },
  })

  const total = logs.length
  if (total === 0) {
    return {
      total: 0,
      last7d: 0,
      fallbackRate: 0,
      avgLatencyMs: null,
      totalOutputTokens: 0,
      byStatus: [],
    }
  }

  const cutoff = subDays(new Date(), 7)
  const last7d = logs.filter((l) => l.createdAt >= cutoff).length
  const fallbacks = logs.filter((l) => l.usedFallback).length
  const avgLatencyMs = Math.round(
    logs.reduce((a, l) => a + l.latencyMs, 0) / total,
  )
  const totalOutputTokens = logs.reduce((a, l) => a + (l.outputTokens ?? 0), 0)

  const counts = new Map<string, number>()
  for (const l of logs) counts.set(l.status, (counts.get(l.status) ?? 0) + 1)
  const byStatus = Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    last7d,
    fallbackRate: Math.round((fallbacks / total) * 100),
    avgLatencyMs,
    totalOutputTokens,
    byStatus,
  }
}
