import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8 shrink-0 drop-shadow-sm", className)}
      role="img"
      aria-label="AuthFlow"
    >
      <defs>
        <linearGradient id="afLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19c2af" />
          <stop offset="100%" stopColor="#0d8a7e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#afLogoGrad)" />
      <rect
        x="0.6"
        y="0.6"
        width="30.8"
        height="30.8"
        rx="7.4"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.18"
      />
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
