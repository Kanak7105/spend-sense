// Server-only: aggregates for the dashboard, computed in Postgres (see the
// phase2_insights migration) so raw transactions never ship to the browser.
import { listBudgetProgress } from "@/backend/features/budgets/queries";
import { getTransactionTotals } from "@/backend/features/transactions/queries";
import type { ServerSupabase } from "@/backend/lib/supabase";
import { addDays, monthOf, monthRange, shiftMonth, todayIST, weekday } from "@/shared/lib/dates";
import { previousPeriod, type Period } from "@/shared/lib/period";
import type { DashboardData, TrendPoint } from "@/shared/types/insights";

/** Heatmap covers this many whole weeks (Sunday-aligned) ending at `asOf`. */
const HEATMAP_WEEKS = 26;

export async function getDashboardData(
  supabase: ServerSupabase,
  period: Period,
): Promise<DashboardData> {
  const today = todayIST();
  const { from, to } = period;
  const asOf = to < today ? to : today;
  const endMonth = monthOf(to);
  const previous = previousPeriod(period);

  const trendStart = `${shiftMonth(endMonth, -11)}-01`;
  const heatmapTo = asOf;
  const heatmapFrom = (() => {
    const start = addDays(heatmapTo, -(HEATMAP_WEEKS * 7 - 1));
    return addDays(start, -weekday(start)); // back to Sunday
  })();

  const [totals, previousTotals, monthly, categories, daily, budgets] = await Promise.all([
    getTransactionTotals(supabase, { from, to }),
    getTransactionTotals(supabase, { from: previous.from, to: previous.to }),
    supabase.rpc("monthly_totals", { p_from: trendStart, p_to: monthRange(endMonth).to }),
    supabase.rpc("category_totals", { p_from: from, p_to: to, p_type: "expense" }),
    supabase.rpc("daily_totals", { p_from: heatmapFrom, p_to: heatmapTo }),
    listBudgetProgress(supabase, endMonth),
  ]);
  for (const result of [monthly, categories, daily]) {
    if (result.error) throw new Error("Could not load insights", { cause: result.error });
  }

  const byMonth = new Map((monthly.data ?? []).map((m) => [monthOf(m.month), m]));
  const trend: TrendPoint[] = Array.from({ length: 12 }, (_, i) => {
    const key = shiftMonth(endMonth, i - 11);
    const row = byMonth.get(key);
    return { month: key, income: row?.income ?? 0, expense: row?.expense ?? 0 };
  });

  return {
    period,
    isCurrentMonth: period.month === monthOf(today),
    asOf,
    totals: { income: totals.income, expense: totals.expense },
    previous: { income: previousTotals.income, expense: previousTotals.expense },
    endMonth,
    trend,
    categories: categories.data ?? [],
    heatmap: {
      from: heatmapFrom,
      to: heatmapTo,
      days: (daily.data ?? []).map((d) => ({ day: d.day, expense: d.expense })),
    },
    budgets,
  };
}
