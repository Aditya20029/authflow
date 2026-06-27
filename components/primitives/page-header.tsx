import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
  className,
}: {
  title: string
  description?: string
  eyebrow?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
