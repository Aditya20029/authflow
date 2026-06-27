import { Stethoscope } from "lucide-react"

export function FooterDisclaimer() {
  return (
    <footer className="border-t border-border px-4 py-3 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-1.5 text-[11px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center">
        <p className="text-pretty">
          AuthFlow is a demonstration prototype. It is not a clinical or
          regulated medical device, is not HIPAA covered, and uses only
          synthetic data.
        </p>
        <p className="flex shrink-0 items-center gap-1.5 font-medium">
          <Stethoscope className="h-3.5 w-3.5 text-primary" />
          Da Vinci CRD to DTR to PAS
        </p>
      </div>
    </footer>
  )
}
