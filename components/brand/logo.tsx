import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8 shrink-0", className)}
      role="img"
      aria-label="AuthFlow"
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--brand))" />
      <path
        d="M6 17.5h4.2l2.1-6.4 3.4 11 2.4-7 1.6 2.4H26"
        fill="none"
        stroke="hsl(var(--brand-foreground))"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
            AuthFlow
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Prior Auth
          </span>
        </span>
      )}
    </span>
  )
}
