import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/frontend/components/ui/chart";
import { formatMoney } from "@/frontend/lib/format";
import type { TrendPoint } from "@/shared/types/insights";

import { monthLabel } from "./month-switcher";

// Colours validated with the dataviz palette script (CVD-safe in both themes).
const config = {
  income: { label: "Income", theme: { light: "#0f9b8e", dark: "#14a090" } },
  expense: { label: "Expenses", theme: { light: "#e34948", dark: "#e8524c" } },
} satisfies ChartConfig;

/** 12-month income vs expenses. One shared ₹ axis; crosshair tooltip on hover. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month, "short") }));

  return (
    <figure>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
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
          <ChartLegend content={<ChartLegendContent />} />
          {(["income", "expense"] as const).map((key) => (
            <Area
              key={key}
              dataKey={key}
              type="monotone"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              fill={`var(--color-${key})`}
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
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
