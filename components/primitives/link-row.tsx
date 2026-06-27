"use client"

import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { TableRow } from "@/components/ui/table"

/**
 * A table row that navigates on click or Enter. Cells should contain a real
 * link to the same target for keyboard and right-click support; this adds the
 * convenience of a fully clickable row.
 */
export function LinkRow({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  return (
    <TableRow
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href)
      }}
      tabIndex={0}
      className={cn(
        "cursor-pointer focus:outline-none focus-visible:bg-muted/70",
        className,
      )}
    >
      {children}
    </TableRow>
  )
}
