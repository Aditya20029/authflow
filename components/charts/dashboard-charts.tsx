"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { CHART_COLORS } from "@/lib/status"

const AXIS = CHART_COLORS.axis
const GRID = CHART_COLORS.grid
const BRAND = CHART_COLORS.brand
const EMERALD = CHART_COLORS.emerald

// Recharts v3 can leave bars stuck in their pre-animation (zero-size) state in
// some renderers. Final geometry renders immediately and screenshots stay crisp
// with animation disabled, so charts are reliable everywhere.
const ANIM = false

/** Shared gradient defs so every chart pulls from one brand palette. */
function ChartDefs() {
  return (
    <defs>
      <linearGradient id="fillBrand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={BRAND} stopOpacity={0.34} />
        <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="fillEmerald" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
        <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="barBrandH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0f9e8f" />
        <stop offset="100%" stopColor="#2dd4bf" />
      </linearGradient>
      <linearGradient id="barBrandV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
    </defs>
  )
}

type TooltipEntry = {
  name?: string
  value?: number | string
  color?: string
  payload?: { hex?: string }
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  valueSuffix?: string
}) {
  if (!active || !payload?.length) return null
  // Layered series (an Area under a Line) can repeat the same name; show each once.
  const seen = new Set<string>()
  const rows = payload.filter((p) => {
    const k = String(p.name ?? "")
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lift backdrop-blur">
      {label && <p className="mb-1.5 font-medium text-foreground">{label}</p>}
      {rows.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.color ?? p.payload?.hex ?? AXIS }}
          />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {p.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export function VolumeAreaChart({
  data,
}: {
  data: { label: string; count: number }[]
}) {
  return (
    <div
      className="h-[260px] w-full"
      role="img"
      aria-label="Prior authorization volume per week over the last 13 weeks"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
          <ChartDefs />
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            width={36}
            tickMargin={6}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="count"
            name="Requests"
            stroke={BRAND}
            strokeWidth={2.25}
            fill="url(#fillBrand)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={ANIM}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusDonut({
  data,
}: {
  data: { key: string; label: string; value: number; hex: string }[]
}) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative h-[176px] w-[176px] shrink-0"
        role="img"
        aria-label={`Status breakdown across ${total} requests`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2.5}
              cornerRadius={4}
              strokeWidth={0}
              isAnimationActive={ANIM}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.hex} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[26px] font-semibold tabular-nums leading-none text-foreground">
            {total}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">requests</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-5 gap-y-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: d.hex }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-pretty leading-tight text-muted-foreground">
              {d.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TurnaroundBarChart({
  data,
}: {
  data: { payer: string; hours: number }[]
}) {
  return (
    <div
      className="h-[260px] w-full"
      role="img"
      aria-label="Average turnaround time in hours by payer"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          barCategoryGap="28%"
        >
          <ChartDefs />
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            unit="h"
          />
          <YAxis
            type="category"
            dataKey="payer"
            tickLine={false}
            axisLine={false}
            width={156}
            tick={{ fontSize: 11, fill: AXIS }}
            tickFormatter={(v: string) => (v.length > 25 ? `${v.slice(0, 24)}…` : v)}
          />
          <Tooltip
            content={<ChartTooltip valueSuffix="h" />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Bar
            dataKey="hours"
            name="Avg turnaround"
            fill="url(#barBrandH)"
            radius={[0, 5, 5, 0]}
            barSize={16}
            isAnimationActive={ANIM}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ApprovalLineChart({
  data,
}: {
  data: { label: string; rate: number }[]
}) {
  return (
    <div
      className="h-[260px] w-full"
      role="img"
      aria-label="Weekly approval rate trend as a percentage"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
          <ChartDefs />
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            width={42}
            tickMargin={6}
          />
          <Tooltip
            content={<ChartTooltip valueSuffix="%" />}
            cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            name="Approval rate"
            stroke="none"
            fill="url(#fillEmerald)"
            isAnimationActive={ANIM}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="Approval rate"
            stroke={EMERALD}
            strokeWidth={2.25}
            dot={{ r: 3, fill: EMERALD, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={ANIM}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
