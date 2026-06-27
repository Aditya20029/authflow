"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
const BLUE = CHART_COLORS.blue
const EMERALD = CHART_COLORS.emerald

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
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lift">
      {label && <p className="mb-1.5 font-medium text-foreground">{label}</p>}
      {payload.map((p, i) => (
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
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="count"
            name="Requests"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#volumeFill)"
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
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div
        className="relative h-[188px] w-[188px] shrink-0"
        role="img"
        aria-label={`Status breakdown across ${total} requests`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={60}
              outerRadius={86}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.hex} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {total}
          </span>
          <span className="text-xs text-muted-foreground">requests</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: d.hex }}
              aria-hidden
            />
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">
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
        >
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
            width={140}
            tick={{ fontSize: 11, fill: AXIS }}
            tickFormatter={(v: string) => (v.length > 17 ? `${v.slice(0, 16)}…` : v)}
          />
          <Tooltip
            content={<ChartTooltip valueSuffix="h" />}
            cursor={{ fill: "rgba(148,163,184,0.1)" }}
          />
          <Bar
            dataKey="hours"
            name="Avg turnaround"
            fill={BLUE}
            radius={[0, 4, 4, 0]}
            barSize={16}
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
        <LineChart data={data} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
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
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            width={34}
            unit="%"
          />
          <Tooltip
            content={<ChartTooltip valueSuffix="%" />}
            cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="Approval rate"
            stroke={EMERALD}
            strokeWidth={2}
            dot={{ r: 3, fill: EMERALD }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
