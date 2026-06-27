// Single source of truth for prior authorization status and priority.
// Labels, badge styles, dot colors, and chart hex values all derive from here so
// the StatusPill, PriorityTag, charts, and filters never drift apart.

export const PA_STATUSES = [
  "Draft",
  "NeedsDocumentation",
  "ReadyToSubmit",
  "Submitted",
  "InReview",
  "Approved",
  "Denied",
  "Appealed",
] as const
export type PaStatus = (typeof PA_STATUSES)[number]

export const PRIORITIES = ["Routine", "Urgent", "STAT"] as const
export type Priority = (typeof PRIORITIES)[number]

export const DOC_SOURCES = ["Chart", "Lab", "Provider", "Manual"] as const
export type DocSource = (typeof DOC_SOURCES)[number]

export type StatusPhase = "open" | "submitted" | "decided"

type StatusMeta = {
  label: string
  description: string
  phase: StatusPhase
  /** Badge classes, AA-checked in light and dark. */
  pill: string
  /** Small solid dot for timelines and legends. */
  dot: string
  /** Fixed hex for Recharts series (kept legible on both themes). */
  hex: string
}

export const STATUS_META: Record<PaStatus, StatusMeta> = {
  Draft: {
    label: "Draft",
    description: "Started but not yet worked",
    phase: "open",
    pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    hex: "#64748b",
  },
  NeedsDocumentation: {
    label: "Needs documentation",
    description: "Required evidence is still missing",
    phase: "open",
    pill: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
    dot: "bg-amber-500",
    hex: "#d97706",
  },
  ReadyToSubmit: {
    label: "Ready to submit",
    description: "All criteria satisfied, awaiting submission",
    phase: "open",
    pill: "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/25 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/25",
    dot: "bg-teal-500",
    hex: "#0d9488",
  },
  Submitted: {
    label: "Submitted",
    description: "Sent to the payer",
    phase: "submitted",
    pill: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
    dot: "bg-blue-500",
    hex: "#2563eb",
  },
  InReview: {
    label: "In review",
    description: "Under payer adjudication",
    phase: "submitted",
    pill: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/25 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/25",
    dot: "bg-indigo-500",
    hex: "#4f46e5",
  },
  Approved: {
    label: "Approved",
    description: "Authorized by the payer",
    phase: "decided",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    dot: "bg-emerald-500",
    hex: "#059669",
  },
  Denied: {
    label: "Denied",
    description: "Not authorized",
    phase: "decided",
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
    dot: "bg-red-500",
    hex: "#dc2626",
  },
  Appealed: {
    label: "Appealed",
    description: "Denial under appeal",
    phase: "submitted",
    pill: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/25 dark:bg-purple-400/10 dark:text-purple-300 dark:ring-purple-400/25",
    dot: "bg-purple-500",
    hex: "#9333ea",
  },
}

type PriorityMeta = {
  label: string
  description: string
  /** Hours before the deadline that defines this priority's clock. */
  slaHours: number
  pill: string
  dot: string
  hex: string
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  Routine: {
    label: "Routine",
    description: "Standard turnaround",
    slaHours: 72,
    pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    hex: "#64748b",
  },
  Urgent: {
    label: "Urgent",
    description: "Expedited review",
    slaHours: 24,
    pill: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
    dot: "bg-amber-500",
    hex: "#d97706",
  },
  STAT: {
    label: "STAT",
    description: "Same-day, time critical",
    slaHours: 4,
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
    dot: "bg-red-500",
    hex: "#dc2626",
  },
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status as PaStatus] ?? STATUS_META.Draft
}

export function priorityMeta(priority: string): PriorityMeta {
  return PRIORITY_META[priority as Priority] ?? PRIORITY_META.Routine
}

export function isDecided(status: string): boolean {
  return statusMeta(status).phase === "decided"
}

export function isOpen(status: string): boolean {
  return statusMeta(status).phase === "open"
}

// ---------------------------------------------------------------------------
// Semantic UI tones. These are the soft badge / callout / text tints used for
// non-status meanings (satisfied, missing, required, approved-action, etc.) so
// those colors share one source of truth and never drift from the palette.
// ---------------------------------------------------------------------------

export type Tone = "success" | "warning" | "danger" | "info" | "brand" | "neutral"

type ToneClasses = {
  /** Soft pill: background, text, and inset ring (AA checked, light + dark). */
  pill: string
  /** Inline text / icon color. */
  text: string
  /** Soft callout: border, background, and text (combine with border/padding). */
  soft: string
  /** Solid bar or dot background. */
  bar: string
}

export const TONE: Record<Tone, ToneClasses> = {
  success: {
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    text: "text-emerald-600 dark:text-emerald-400",
    soft: "border-emerald-600/25 bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  warning: {
    pill: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
    text: "text-amber-600 dark:text-amber-400",
    soft: "border-amber-600/25 bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  danger: {
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/25 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
    text: "text-red-600 dark:text-red-400",
    soft: "border-red-600/25 bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
    bar: "bg-red-500",
  },
  info: {
    pill: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/25 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
    text: "text-blue-600 dark:text-blue-400",
    soft: "border-blue-600/25 bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  brand: {
    pill: "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/25 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/25",
    text: "text-teal-600 dark:text-teal-400",
    soft: "border-teal-600/25 bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300",
    bar: "bg-teal-500",
  },
  neutral: {
    pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
    text: "text-slate-500 dark:text-slate-400",
    soft: "border-slate-500/20 bg-slate-50 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300",
    bar: "bg-slate-400",
  },
}

/** Fixed hex values for Recharts series, kept in sync with the palette. */
export const CHART_COLORS = {
  brand: "#0D9488",
  blue: "#2563eb",
  emerald: "#059669",
  red: "#dc2626",
  axis: "#94a3b8",
  grid: "rgba(148,163,184,0.18)",
}

/** Statuses considered "in flight" with the payer. */
export const ACTIVE_WITH_PAYER: PaStatus[] = ["Submitted", "InReview", "Appealed"]

/** Statuses that still need practice action before submission. */
export const NEEDS_PRACTICE_ACTION: PaStatus[] = [
  "Draft",
  "NeedsDocumentation",
  "ReadyToSubmit",
]
