import { cn } from "@/lib/utils"

export function DescList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <dl className={cn("divide-y divide-border", className)}>{children}</dl>
}

export function Desc({
  label,
  children,
  mono = false,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-right text-sm text-foreground",
          mono && "font-code text-xs",
        )}
      >
        {children}
      </dd>
    </div>
  )
}
