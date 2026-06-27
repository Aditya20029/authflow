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
        <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
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
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.1)" }}
          />
          <Bar dataKey="value" name="Requests" fill={CHART_COLORS.brand} radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBarChart({
  data,
  color = CHART_COLORS.blue,
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
        >
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
            cursor={{ fill: "rgba(148,163,184,0.1)" }}
          />
          <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]} maxBarSize={26}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.hex ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
