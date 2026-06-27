import Anthropic from "@anthropic-ai/sdk"

import { getPaDetail } from "@/lib/data/pa"
import {
  lomnDataFromPa,
  lomnUserMessage,
  buildFallbackLetter,
  LOMN_SYSTEM,
} from "@/lib/letter"
import {
  allowRequest,
  underSpendCap,
  noteModelCall,
  recordGeneration,
  clientIp,
  type GenStatus,
} from "@/lib/ai-telemetry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function textResponse(body: BodyInit) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(req: Request) {
  const started = Date.now()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError("Request body must be valid JSON.", 400)
  }

  const paId =
    typeof body === "object" && body !== null
      ? (body as { paId?: unknown }).paId
      : undefined
  if (typeof paId !== "string" || paId.length === 0) {
    return jsonError("A prior authorization id (paId) is required.", 400)
  }

  const pa = await getPaDetail(paId)
  if (!pa) {
    return jsonError("That prior authorization could not be found.", 404)
  }

  const data = lomnDataFromPa(pa)
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8"
  const ip = clientIp(req)

  // Serve the deterministic template (no crash, no cost) whenever the live
  // model is unavailable or guarded: no key, rate limited, or over the cap.
  const fallback = async (status: GenStatus) => {
    await recordGeneration({
      requestId: paId,
      model: "template",
      usedFallback: true,
      status,
      latencyMs: Date.now() - started,
    })
    return textResponse(buildFallbackLetter(data))
  }

  if (!apiKey) return fallback("ok")
  if (!allowRequest(ip)) return fallback("rate_limited")
  if (!underSpendCap()) return fallback("capped")

  noteModelCall()
  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamedAny = false
      let status: GenStatus = "ok"
      let inputTokens: number | null = null
      let outputTokens: number | null = null
      try {
        const client = new Anthropic({ apiKey })
        const stream = client.messages.stream({
          model,
          max_tokens: 1200,
          system: LOMN_SYSTEM,
          messages: [{ role: "user", content: lomnUserMessage(data) }],
        })
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            streamedAny = true
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        const final = await stream.finalMessage()
        inputTokens = final.usage?.input_tokens ?? null
        outputTokens = final.usage?.output_tokens ?? null
      } catch {
        status = "error"
        if (!streamedAny) {
          controller.enqueue(encoder.encode(buildFallbackLetter(data)))
        }
      } finally {
        controller.close()
        // Fire and forget: telemetry must not block stream teardown, and the
        // write swallows its own errors.
        void recordGeneration({
          requestId: paId,
          model,
          usedFallback: status === "error" && !streamedAny,
          status,
          latencyMs: Date.now() - started,
          inputTokens,
          outputTokens,
        })
      }
    },
  })

  return textResponse(readable)
}
