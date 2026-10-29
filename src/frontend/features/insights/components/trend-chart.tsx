import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/frontend/components/ui/chart";
import { formatMoney } from "@/frontend/lib/format";
import type { TrendPoint } from "@/shared/types/insights";

import { monthLabel } from "./month-switcher";

// Colours from --chart-income/--chart-expense, validated with the dataviz palette
// script. Dark mode's pair sits in the 6–8 CVD band, so expense is also dashed.
const config = {
  income: { label: "Income", color: "var(--chart-income)" },
  expense: { label: "Expenses", color: "var(--chart-expense)" },
} satisfies ChartConfig;

const DASH = { income: undefined, expense: "6 4" } as const;

/** 12-month income vs expenses. One shared ₹ axis; crosshair tooltip on hover. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month, "short") }));

  return (
    <figure>
      <ChartContainer config={config} className="aspect-auto h-64 w-full font-mono">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            tickFormatter={(v: string) => v.split(" ")[0]}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => formatMoney(v, { compact: true })}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "4 4" }}
            content={
              <ChartTooltipContent
                labelKey="label"
                indicator="line"
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label ?? name}
                    </span>
                    <span className="font-medium tabular-nums">{formatMoney(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          {(["income", "expense"] as const).map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              strokeDasharray={DASH[key]}
              fill="none"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
      <figcaption className="mt-2 flex justify-center gap-5 font-mono text-xs">
        {(["income", "expense"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden>
              <line
                x1="1"
                y1="3"
                x2="21"
                y2="3"
                stroke={`var(--chart-${key})`}
                strokeWidth="2"
                strokeDasharray={DASH[key] === undefined ? undefined : "4 3"}
              />
            </svg>
            {config[key].label}
          </span>
        ))}
      </figcaption>
      <table className="sr-only">
        <caption>Monthly income and expenses</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <td>{r.label}</td>
              <td>{formatMoney(r.income)}</td>
              <td>{formatMoney(r.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
