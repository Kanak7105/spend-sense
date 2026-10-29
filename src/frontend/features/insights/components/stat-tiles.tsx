import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card, CardContent } from "@/frontend/components/ui/card";
import { formatHeroMoney } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";
import type { MonthTotals } from "@/shared/types/insights";

type Tile = {
  label: string;
  value: string;
  /** Change vs previous month, already formatted, with direction. */
  delta?: { text: string; direction: "up" | "down" | "flat" };
  tone?: "income" | "expense";
};

function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function delta(current: number, previous: number, against: string): Tile["delta"] {
  const change = percentChange(current, previous);
  if (change === null) return undefined;
  return {
    text: `${Math.abs(change)}% vs ${against}`,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

/**
 * Hero numbers for the period. Deltas use text tokens + an arrow, never colour alone.
 * `against` names the comparison period, e.g. "last month".
 */
export function StatTiles({
  totals,
  previous,
  against,
}: {
  totals: MonthTotals;
  previous: MonthTotals;
  against: string;
}) {
  const net = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? Math.round((net / totals.income) * 100) : null;

  const tiles: Tile[] = [
    {
      label: "Income",
      value: formatHeroMoney(totals.income),
      delta: delta(totals.income, previous.income, against),
      tone: "income",
    },
    {
      label: "Expenses",
      value: formatHeroMoney(totals.expense),
      delta: delta(totals.expense, previous.expense, against),
      tone: "expense",
    },
    { label: "Net", value: formatHeroMoney(net) },
    {
      label: "Savings rate",
      value: savingsRate === null ? "—" : `${savingsRate}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="py-0">
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {tile.tone && (
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full",
                    tile.tone === "income" ? "bg-(--chart-income)" : "bg-(--chart-expense)",
                  )}
                />
              )}
              {tile.label}
            </span>
            <span className="truncate font-display text-2xl font-bold sm:text-3xl">
              {tile.value}
            </span>
            {tile.delta && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {tile.delta.direction === "up" ? (
                  <ArrowUpRight className="size-3.5" />
                ) : tile.delta.direction === "down" ? (
                  <ArrowDownRight className="size-3.5" />
                ) : (
                  <Minus className="size-3.5" />
                )}
                {tile.delta.text}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
