"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/charts/dashboard-charts"
import { CHART_COLORS } from "@/lib/status"

const AXIS = CHART_COLORS.axis
const GRID = CHART_COLORS.grid

// See dashboard-charts: disabling the entry animation keeps recharts v3 bars
// from getting stuck empty and makes screenshots deterministic.
const ANIM = false

function BarDefs() {
  return (
    <defs>
      <linearGradient id="aBarV" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="aBarH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0f9e8f" />
        <stop offset="100%" stopColor="#2dd4bf" />
      </linearGradient>
    </defs>
  )
}

export function DistributionBarChart({
  data,
}: {
  data: { label: string; value: number }[]
}) {
  return (
    <div
      className="h-[260px] w-full"
      role="img"
      aria-label="Turnaround time distribution"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
          <BarDefs />
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            width={36}
            tickMargin={6}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Bar
            dataKey="value"
            name="Requests"
            fill="url(#aBarV)"
            radius={[5, 5, 0, 0]}
            maxBarSize={52}
            isAnimationActive={ANIM}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBarChart({
  data,
  color,
  unit = "",
  ariaLabel,
  height = 280,
}: {
  data: { label: string; value: number; hex?: string }[]
  color?: string
  unit?: string
  ariaLabel: string
  height?: number
}) {
  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
          barCategoryGap="26%"
        >
          <BarDefs />
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: AXIS }}
            unit={unit}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={150}
            tick={{ fontSize: 11, fill: AXIS }}
            tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
          />
          <Tooltip
            content={<ChartTooltip valueSuffix={unit} />}
            cursor={{ fill: "rgba(148,163,184,0.08)" }}
          />
          <Bar
            dataKey="value"
            name="Count"
            radius={[0, 5, 5, 0]}
            maxBarSize={24}
            fill="url(#aBarH)"
            isAnimationActive={ANIM}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.hex ?? color ?? "url(#aBarH)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
