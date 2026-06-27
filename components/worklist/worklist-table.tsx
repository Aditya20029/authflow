"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ListFilter,
  X,
  Inbox,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  PA_STATUSES,
  PRIORITIES,
  STATUS_META,
  PRIORITY_META,
} from "@/lib/status"
import type { WorklistRow } from "@/lib/data/worklist"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusPill } from "@/components/primitives/status-pill"
import { PriorityTag } from "@/components/primitives/priority-tag"
import { DeadlineBadge } from "@/components/primitives/deadline-badge"
import { LinkRow } from "@/components/primitives/link-row"
import { EmptyState } from "@/components/primitives/empty-state"

type SortKey = "created" | "deadline" | "patient" | "status"
type SortDir = "asc" | "desc"

const statusOrder = (s: string) => {
  const i = PA_STATUSES.indexOf(s as (typeof PA_STATUSES)[number])
  return i === -1 ? 99 : i
}

export function WorklistTable({ rows }: { rows: WorklistRow[] }) {
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("all")
  const [payer, setPayer] = React.useState("all")
  const [priority, setPriority] = React.useState("all")
  const [sortKey, setSortKey] = React.useState<SortKey>("created")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")

  const payers = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.payerName))).sort(),
    [rows],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (payer !== "all" && r.payerName !== payer) return false
      if (priority !== "all" && r.priority !== priority) return false
      if (q) {
        const hay =
          `${r.patientName} ${r.medicationName} ${r.medicationBrand ?? ""} ${r.referenceId} ${r.payerName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "patient":
          cmp = a.patientName.localeCompare(b.patientName)
          break
        case "status":
          cmp = statusOrder(a.status) - statusOrder(b.status)
          break
        case "deadline": {
          const av = a.hoursLeft ?? Number.POSITIVE_INFINITY
          const bv = b.hoursLeft ?? Number.POSITIVE_INFINITY
          cmp = av - bv
          break
        }
        case "created":
        default:
          cmp = a.createdAtIso.localeCompare(b.createdAtIso)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [rows, query, status, payer, priority, sortKey, sortDir])

  const hasFilters =
    query !== "" || status !== "all" || payer !== "all" || priority !== "all"

  const clearFilters = () => {
    setQuery("")
    setStatus("all")
    setPayer("all")
    setPriority("all")
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "patient" ? "asc" : "desc")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patient, drug, PA ID, payer"
            className="pl-9"
            aria-label="Search requests"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ListFilter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PA_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={payer} onValueChange={setPayer}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by payer">
              <SelectValue placeholder="Payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payers</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[140px]" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          <span className="font-medium tabular-nums text-foreground">
            {filtered.length}
          </span>{" "}
          of {rows.length} requests
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortHead label="Patient" active={sortKey === "patient"} dir={sortDir} onClick={() => toggleSort("patient")} />
                <TableHead>Medication</TableHead>
                <TableHead className="hidden lg:table-cell">Payer</TableHead>
                <SortHead label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <SortHead label="Created" className="hidden md:table-cell" active={sortKey === "created"} dir={sortDir} onClick={() => toggleSort("created")} />
                <SortHead label="Deadline" align="right" active={sortKey === "deadline"} dir={sortDir} onClick={() => toggleSort("deadline")} />
                <TableHead className="hidden xl:table-cell">Coordinator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <LinkRow key={r.id} href={`/pa/${r.id}`}>
                  <TableCell>
                    <Link
                      href={`/pa/${r.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {r.patientName}
                    </Link>
                    <div className="font-code text-xs text-muted-foreground">
                      {r.referenceId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-sm">{r.medicationName}</span>
                    {r.medicationBrand && (
                      <div className="text-xs text-muted-foreground">
                        {r.medicationBrand}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{r.payerName}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <PriorityTag priority={r.priority} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                    {r.createdLabel}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeadlineBadge state={r.deadlineState} label={r.deadlineLabel} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      {r.coordinator ?? "Unassigned"}
                    </span>
                  </TableCell>
                </LinkRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            className="m-4 border-0"
            icon={Inbox}
            title="No requests match"
            description="Adjust the search or filters to widen the results."
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}

function SortHead({
  label,
  active,
  dir,
  onClick,
  align = "left",
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
  className?: string
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  )
}
