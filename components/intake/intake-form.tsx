"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  Check,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  evaluateCoverage,
  buildRequiredDocuments,
  assessReadiness,
} from "@/lib/rules"
import { PRIORITIES, PRIORITY_META, TONE } from "@/lib/status"
import { createPriorAuth } from "@/lib/actions/pa"
import type { IntakeData } from "@/lib/data/intake"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionCard } from "@/components/primitives/section-card"

const STEPS = [
  { n: 1, label: "Order" },
  { n: 2, label: "Documentation" },
  { n: 3, label: "Submit" },
]

export function IntakeForm({ data }: { data: IntakeData }) {
  const router = useRouter()
  const [patientId, setPatientId] = React.useState("")
  const [providerId, setProviderId] = React.useState("")
  const [medicationId, setMedicationId] = React.useState("")
  const [priority, setPriority] = React.useState("Routine")
  const [pending, startTransition] = React.useTransition()

  const patient = data.patients.find((p) => p.id === patientId)
  const provider = data.providers.find((p) => p.id === providerId)
  const medication = data.medications.find((m) => m.id === medicationId)

  const criteria =
    patient && medication
      ? (data.rules[`${patient.payerId}:${medication.id}`] ?? null)
      : null

  const coverage =
    patient && medication
      ? evaluateCoverage({
          planName: patient.payerName,
          drugName: medication.name,
          drugClass: medication.drugClass,
          isSpecialty: medication.isSpecialty,
          criteria,
        })
      : null

  const docs =
    coverage?.required && criteria && patient
      ? buildRequiredDocuments({
          drugName: medication!.name,
          criteria,
          chart: patient.chart,
          memberId: patient.memberId,
          providerName: provider?.name ?? "Prescriber",
          providerNpi: provider?.npi ?? "",
          hasLetterOfMedicalNecessity: false,
        })
      : []
  const readiness = docs.length ? assessReadiness(docs) : null

  const showCoverage = Boolean(patient && medication)
  const canCreate = Boolean(patient && provider && medication && coverage?.required)
  const currentStep = !showCoverage ? 1 : coverage?.required ? (provider ? 3 : 2) : 2

  function handleCreate() {
    if (!canCreate) return
    startTransition(async () => {
      try {
        await createPriorAuth({ patientId, providerId, medicationId, priority })
        // createPriorAuth redirects on success; this line is reached only if not.
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not create the request."
        if (!message.includes("NEXT_REDIRECT")) toast.error(message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <Stepper current={currentStep} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Order"
          description="Choose the patient, prescriber, and medication. Coverage is checked the moment a drug and plan are in place."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Patient" htmlFor="patient">
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="patient">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {data.patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.mrn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Prescriber" htmlFor="provider">
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a prescriber" />
                </SelectTrigger>
                <SelectContent>
                  {data.providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.specialty}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Medication or service" htmlFor="medication">
              <Select value={medicationId} onValueChange={setMedicationId}>
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Select a medication" />
                </SelectTrigger>
                <SelectContent>
                  {data.medications.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.brandName && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {m.brandName}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority" htmlFor="priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {PRIORITY_META[p].slaHours}h target
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {patient && (
            <p className="mt-4 text-sm text-muted-foreground">
              Plan on file:{" "}
              <span className="font-medium text-foreground">{patient.payerName}</span>
              {" · "}
              {patient.age} year old {patient.sex.toLowerCase()}
            </p>
          )}
        </SectionCard>

        <div className="lg:sticky lg:top-6">
          {showCoverage && coverage ? (
            <SectionCard
              title="Coverage check"
              description="Real-time Coverage Requirements Discovery for this drug and plan."
            >
              <CoverageResult coverage={coverage} />
            </SectionCard>
          ) : (
            <CoveragePreviewGhost />
          )}
        </div>
      </div>

      {showCoverage && coverage?.required && readiness && patient && (
        <SectionCard
          title="Documentation readiness"
          description="What the payer requires, auto-checked against the patient's chart."
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm">
                From{" "}
                <span className="font-medium text-foreground">
                  {patient.name.split(" ")[0]}
                </span>
                {"'s"} chart,{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {readiness.satisfied}
                </span>{" "}
                of{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {readiness.total}
                </span>{" "}
                requirements can be auto-filled.{" "}
                {readiness.missing.length > 0 ? (
                  <span className={TONE.warning.text}>
                    {readiness.missing.length} should be captured before the
                    patient leaves.
                  </span>
                ) : (
                  <span className={TONE.brand.text}>
                    Everything needed is already on file.
                  </span>
                )}
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {docs.map((d) => (
                <li key={d.label} className="flex items-center gap-2 text-sm">
                  {d.satisfied ? (
                    <CheckCircle2 className={cn("h-4 w-4 shrink-0", TONE.success.text)} />
                  ) : (
                    <CircleAlert className={cn("h-4 w-4 shrink-0", TONE.warning.text)} />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      d.satisfied ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {d.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {!showCoverage
            ? "Select a patient and medication to run the coverage check."
            : coverage?.required
              ? provider
                ? "Creating the request opens it for documentation and submission."
                : "Select a prescriber to continue."
              : "No prior authorization is required. This order can proceed directly."}
        </p>
        <Button
          size="lg"
          disabled={!canCreate || pending}
          onClick={handleCreate}
          className="sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating request
            </>
          ) : (
            <>
              Create prior authorization
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function CoveragePreviewGhost() {
  const previews = [
    "Whether a prior authorization is required",
    "Which documents the payer requires",
    "What is already captured in the chart",
  ]
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">
          Coverage check
        </h3>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          Pick a patient and medication to run real-time Coverage Requirements
          Discovery and see exactly what this plan needs, before the patient
          leaves the room.
        </p>
      </div>
      <ul className="space-y-2 border-t border-border/70 pt-3">
        {previews.map((t) => (
          <li
            key={t}
            className="flex items-center gap-2.5 text-sm text-muted-foreground"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40"
              aria-hidden
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CoverageResult({
  coverage,
}: {
  coverage: ReturnType<typeof evaluateCoverage>
}) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          coverage.required ? TONE.warning.pill : TONE.success.pill,
        )}
      >
        {coverage.required ? (
          <ShieldAlert className="h-3.5 w-3.5" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
        {coverage.required
          ? "Prior authorization required"
          : "No prior authorization required"}
      </div>
      <ul className="space-y-2">
        {coverage.reasons.map((r, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <span className="text-pretty text-foreground/90">{r}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = current > s.n
        const active = current === s.n
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary/15 text-primary ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : s.n}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                active || done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  done ? "bg-primary/40" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
