import type { MonthKey } from "@/shared/lib/dates";
import type { Period } from "@/shared/lib/period";
import type { BudgetProgress } from "@/shared/schemas/budgets";

export type MonthTotals = { income: number; expense: number };

export type TrendPoint = MonthTotals & { month: MonthKey };

export type CategorySlice = {
  category_id: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
};

export type HeatmapDay = { day: string; expense: number };

/** Everything the dashboard renders for one period (backend → page props). */
export type DashboardData = {
  period: Period;
  /** The period is the current calendar month (no "next month" to go to). */
  isCurrentMonth: boolean;
  /** Last day shown in the heatmap: the period's end, or today if that's sooner. */
  asOf: string;
  totals: MonthTotals;
  /** Totals for `previousPeriod(period)`. */
  previous: MonthTotals;
  /** Month the period ends in: the trend ends here and budgets are shown for it. */
  endMonth: MonthKey;
  /** 12 months ending at `endMonth`, zero-filled. */
  trend: TrendPoint[];
  categories: CategorySlice[];
  heatmap: { from: string; to: string; days: HeatmapDay[] };
  budgets: BudgetProgress[];
};
