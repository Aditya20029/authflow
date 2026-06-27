import { prisma } from "@/lib/prisma"

// In-memory guards for the AI letter endpoint. These live per server instance,
// which is the right scope for a single-host demo; a multi-instance production
// deploy would back these with Redis or a durable counter.

const WINDOW_MS = 5 * 60 * 1000
const MAX_PER_WINDOW = 20
const DAILY_AI_CAP = 200

const hitsByIp = new Map<string, number[]>()
let spend = { day: "", count: 0 }

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Per-IP sliding window. Returns false when the caller is over the limit. */
export function allowRequest(ip: string): boolean {
  const now = Date.now()
  const recent = (hitsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hitsByIp.set(ip, recent)
    return false
  }
  recent.push(now)
  hitsByIp.set(ip, recent)

  // Opportunistically drop fully-expired IP entries so the map cannot grow
  // unbounded across many distinct callers.
  if (hitsByIp.size > 5000) {
    hitsByIp.forEach((times, key) => {
      if (times.every((t) => now - t >= WINDOW_MS)) hitsByIp.delete(key)
    })
  }
  return true
}

/** Daily cap on live model calls. Returns false once the cap is reached. */
export function underSpendCap(): boolean {
  if (spend.day !== today()) spend = { day: today(), count: 0 }
  return spend.count < DAILY_AI_CAP
}

export function noteModelCall(): void {
  if (spend.day !== today()) spend = { day: today(), count: 0 }
  spend.count += 1
}

export type GenStatus = "ok" | "error" | "rate_limited" | "capped"

export async function recordGeneration(data: {
  requestId?: string | null
  model: string
  usedFallback: boolean
  status: GenStatus
  latencyMs: number
  inputTokens?: number | null
  outputTokens?: number | null
}): Promise<void> {
  // Telemetry must never break the response, so swallow any write failure.
  try {
    await prisma.generationLog.create({
      data: {
        requestId: data.requestId ?? null,
        model: data.model,
        usedFallback: data.usedFallback,
        status: data.status,
        latencyMs: Math.max(0, Math.round(data.latencyMs)),
        inputTokens: data.inputTokens ?? null,
        outputTokens: data.outputTokens ?? null,
      },
    })
  } catch {
    // ignore
  }
}

// Trusts x-forwarded-for / x-real-ip, which assumes the app sits behind a
// trusted proxy that sets them (for example Vercel). The per-IP limit is a
// best-effort guard; the global spend cap is the hard ceiling that a spoofed
// header cannot bypass.
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return req.headers.get("x-real-ip") ?? "local"
}
