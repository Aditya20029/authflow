import { cn } from "@/lib/utils"

export type TimelineItem = {
  id: string
  title: string
  description?: string | null
  meta?: string
  dotClass?: string
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((it, i) => {
        const last = i === items.length - 1
        return (
          <li key={it.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                className="absolute left-[5px] top-3 h-full w-px bg-border"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card",
                it.dotClass ?? "bg-primary",
              )}
              aria-hidden
            />
            <div className="-mt-0.5 min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{it.title}</p>
              {it.description && (
                <p className="text-pretty text-sm text-muted-foreground">
                  {it.description}
                </p>
              )}
              {it.meta && (
                <p className="mt-0.5 text-xs text-muted-foreground/80">{it.meta}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
