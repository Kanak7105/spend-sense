import { PieChart as PieIcon } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/frontend/components/ui/chart";
import { formatMoney } from "@/frontend/lib/format";
import { sumMoney } from "@/frontend/lib/money";
import type { CategorySlice } from "@/shared/types/insights";

/** Part-to-whole reads at a glance only up to ~6 segments; the tail folds into "Other". */
const MAX_SLICES = 5;
const OTHER_COLOR = "#94a3b8";

type Slice = CategorySlice & { share: number };

function toSlices(categories: CategorySlice[]): Slice[] {
  const total = sumMoney(categories.map((c) => c.total));
  const head = categories.slice(0, MAX_SLICES);
  const tail = categories.slice(MAX_SLICES);
  const slices: CategorySlice[] = tail.length
    ? [
        ...head,
        {
          category_id: "other",
          name: `Other (${tail.length})`,
          icon: "circle-ellipsis",
          color: OTHER_COLOR,
          total: sumMoney(tail.map((c) => c.total)),
        },
      ]
    : head;
  return slices.map((s) => ({ ...s, share: total ? s.total / total : 0 }));
}

/**
 * Spending by category for the month. Each slice keeps its category's own
 * colour (colour follows the entity), and the legend names every slice so
 * identity never rests on colour alone.
 */
export function CategoryDonut({ categories }: { categories: CategorySlice[] }) {
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="No spending yet"
        description="Expenses for this month will be broken down here."
      />
    );
  }

  const slices = toSlices(categories);
  const total = sumMoney(categories.map((c) => c.total));
  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [s.category_id ?? "none", { label: s.name, color: s.color }]),
  );

  return (
    // Side by side only when the card itself is wide enough (it's narrow in the
    // dashboard's 2/5 column even on large screens).
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @lg:flex-row">
        <div className="relative size-44 shrink-0">
          <ChartContainer config={config} className="aspect-square size-44">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  const slice = active ? (payload?.[0]?.payload as Slice | undefined) : undefined;
                  if (!slice) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <p className="font-medium">{slice.name}</p>
                      <p className="text-muted-foreground tabular-nums">
                        {formatMoney(slice.total)} · {Math.round(slice.share * 100)}%
                      </p>
                    </div>
                  );
                }}
              />
              <Pie
                data={slices}
                dataKey="total"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s) => (
                  <Cell key={s.category_id ?? "none"} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Spent</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatMoney(total, { compact: true })}
            </span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-col gap-2.5">
          {slices.map((s) => (
            <li key={s.category_id ?? "none"} className="flex items-center gap-3 text-sm">
              <CategoryIcon icon={s.icon} color={s.color} size="sm" />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(s.share * 100)}%
              </span>
              <span className="w-24 text-right font-medium tabular-nums">
                {formatMoney(s.total)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
