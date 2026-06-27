"use client"

import * as React from "react"
import {
  Loader2,
  Wand2,
  Send,
  PlayCircle,
  Gavel,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { TONE } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  autoFillFromChart,
  submitToPayer,
  simulateDecision,
  startAppeal,
} from "@/lib/actions/pa"

export function PaActionBar({
  paId,
  status,
  payerName,
}: {
  paId: string
  status: string
  payerName: string
}) {
  const [busy, setBusy] = React.useState<string | null>(null)

  async function run(
    key: string,
    fn: () => Promise<unknown>,
    onDone: (result: unknown) => void,
  ) {
    setBusy(key)
    try {
      const result = await fn()
      onDone(result)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "The action could not be completed."
      if (!message.includes("NEXT_REDIRECT")) toast.error(message)
    } finally {
      setBusy(null)
    }
  }

  const isOpen = ["Draft", "NeedsDocumentation", "ReadyToSubmit"].includes(status)
  const isSubmitted = ["Submitted", "InReview", "Appealed"].includes(status)
  const isDenied = status === "Denied"
  const isApproved = status === "Approved"
  const anyBusy = busy !== null

  const onAutoFill = () =>
    run("autofill", () => autoFillFromChart(paId), () =>
      toast.success("Documentation auto-filled from the chart"),
    )
  const onSubmit = () =>
    run("submit", () => submitToPayer(paId), () =>
      toast.success(`Submitted to ${payerName}`),
    )
  const onSimulate = () =>
    run("simulate", () => simulateDecision(paId), (result) => {
      if (result === "Approved") toast.success(`Approved by ${payerName}`)
      else if (result === "Denied") toast.error("Denied by the payer")
      else toast.info("Payer requested additional information")
    })
  const onAppeal = () =>
    run("appeal", () => startAppeal(paId), () =>
      toast.success("Appeal submitted"),
    )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {isApproved
          ? "This request has been approved by the payer."
          : isDenied
            ? "This request was denied. Review the reason and start an appeal."
            : isSubmitted
              ? "Awaiting the payer decision."
              : "Auto-fill from the chart, then submit to the payer."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {isApproved && (
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${TONE.success.text}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </span>
        )}

        {isOpen && (
          <>
            <Button
              variant="outline"
              onClick={onAutoFill}
              disabled={anyBusy}
            >
              {busy === "autofill" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Auto-fill from chart
            </Button>
            <Button onClick={onSubmit} disabled={anyBusy}>
              {busy === "submit" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit to payer
            </Button>
          </>
        )}

        {isSubmitted && (
          <Button onClick={onSimulate} disabled={anyBusy}>
            {busy === "simulate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Simulate payer decision
          </Button>
        )}

        {isDenied && (
          <Button onClick={onAppeal} disabled={anyBusy}>
            {busy === "appeal" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Gavel className="h-4 w-4" />
            )}
            Start appeal
          </Button>
        )}
      </div>
    </div>
  )
}
