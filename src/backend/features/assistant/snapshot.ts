// Server-only: compact data summaries for the AI assistant, built from the
// existing queries and Postgres aggregates. Never includes raw transaction rows.
// Output must be deterministic (fixed key order, stable sorting) because its
// hash is the cache key for saved answers.
import { listBudgetProgress } from "@/backend/features/budgets/queries";
import { listGoals } from "@/backend/features/goals/queries";
import { listRecurringRules } from "@/backend/features/recurring/queries";
import { getTransactionTotals } from "@/backend/features/transactions/queries";
import type { ServerSupabase } from "@/backend/lib/supabase";
import {
  addDays,
  daysBetween,
  monthOf,
  monthRange,
  shiftMonth,
  weekday,
  type MonthKey,
} from "@/shared/lib/dates";

/** Categories beyond this are folded into "Other" to keep prompts small. */
const MAX_CATEGORIES = 10;
const RECURRING_WINDOW_DAYS = 30;

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function periodTotals(supabase: ServerSupabase, from: string, to: string) {
  const t = await getTransactionTotals(supabase, { from, to });
  return {
    income: round2(t.income),
    expense: round2(t.expense),
    net: round2(t.income - t.expense),
    transaction_count: t.count,
  };
}

async function categoryTotals(
  supabase: ServerSupabase,
  from: string,
  to: string,
  type: "expense" | "income",
) {
  const { data, error } = await supabase.rpc("category_totals", {
    p_from: from,
    p_to: to,
    p_type: type,
  });
  if (error) throw new Error("Could not load category totals", { cause: error });

  const rows = data
    .map((c) => ({ category: c.name, amount: round2(c.total) }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));
  if (rows.length <= MAX_CATEGORIES) return rows;

  const other = rows.slice(MAX_CATEGORIES - 1).reduce((sum, r) => sum + r.amount, 0);
  return [...rows.slice(0, MAX_CATEGORIES - 1), { category: "Other", amount: round2(other) }];
}

export async function categorySpending(supabase: ServerSupabase, from: string, to: string) {
  const rows = await categoryTotals(supabase, from, to, "expense");
  return rows.map(({ category, amount }) => ({ category, spent: amount }));
}

export async function incomeSources(supabase: ServerSupabase, from: string, to: string) {
  const rows = await categoryTotals(supabase, from, to, "income");
  return rows.map(({ category, amount }) => ({ category, received: amount }));
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Spending per day of the week between `from` and `to` (inclusive). */
export async function weekdaySpending(supabase: ServerSupabase, from: string, to: string) {
  const { data, error } = await supabase.rpc("daily_totals", { p_from: from, p_to: to });
  if (error) throw new Error("Could not load daily totals", { cause: error });

  const totals = WEEKDAYS.map(() => 0);
  const spendDays = WEEKDAYS.map(() => 0);
  for (const d of data) {
    if (d.expense <= 0) continue;
    totals[weekday(d.day)] += d.expense;
    spendDays[weekday(d.day)] += 1;
  }
  // How many of each weekday the range contains, so averages are fair.
  const occurrences = WEEKDAYS.map(() => 0);
  const days = daysBetween(from, to) + 1;
  for (let i = 0; i < days; i++) occurrences[weekday(addDays(from, i))] += 1;

  return WEEKDAYS.map((day, i) => ({
    day,
    total_spent: round2(totals[i]),
    average_per_day: occurrences[i] ? round2(totals[i] / occurrences[i]) : 0,
    days_with_spending: spendDays[i],
  }));
}

/** Income/expense per month for the `months` months ending at `end`, zero-filled. */
export async function monthlyTrend(supabase: ServerSupabase, end: MonthKey, months: number) {
  const start = shiftMonth(end, 1 - months);
  const { data, error } = await supabase.rpc("monthly_totals", {
    p_from: `${start}-01`,
    p_to: monthRange(end).to,
  });
  if (error) throw new Error("Could not load monthly totals", { cause: error });

  const byMonth = new Map(data.map((m) => [monthOf(m.month), m]));
  return Array.from({ length: months }, (_, i) => {
    const month = shiftMonth(start, i);
    const row = byMonth.get(month);
    const income = round2(row?.income ?? 0);
    const expense = round2(row?.expense ?? 0);
    return { month, income, expense, net: round2(income - expense) };
  });
}

export async function budgetStatus(supabase: ServerSupabase, month: MonthKey) {
  const budgets = await listBudgetProgress(supabase, month);
  return budgets
    .map((b) => ({
      category: b.name,
      budget: round2(b.amount),
      spent: round2(b.spent),
      percent_of_budget_used: Math.round((b.spent / b.amount) * 100),
      over_budget_by: round2(Math.max(b.spent - b.amount, 0)),
    }))
    .sort(
      (a, b) =>
        b.percent_of_budget_used - a.percent_of_budget_used || a.category.localeCompare(b.category),
    );
}

/** Whole months from `month` to the deadline's month (0 = due this month). */
function monthsUntil(month: MonthKey, deadline: string) {
  const [y1, m1] = month.split("-").map(Number);
  const [y2, m2] = deadline.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export async function goalsStatus(supabase: ServerSupabase, month: MonthKey) {
  const goals = await listGoals(supabase);
  return goals.map((g) => ({
    name: g.name,
    target: round2(g.target_amount),
    saved: round2(g.saved_amount),
    remaining: round2(Math.max(g.target_amount - g.saved_amount, 0)),
    progress_percent: Math.round((g.saved_amount / g.target_amount) * 100),
    deadline: g.deadline,
    months_left: g.deadline ? monthsUntil(month, g.deadline) : null,
  }));
}

/** Active recurring income/expenses due in the next 30 days. */
export async function upcomingRecurring(supabase: ServerSupabase, today: string) {
  const until = addDays(today, RECURRING_WINDOW_DAYS);
  const rules = await listRecurringRules(supabase);
  return rules
    .filter((r) => r.is_active && r.type !== "transfer" && r.next_run_date <= until)
    .map((r) => ({
      name: r.description || r.category?.name || "Uncategorised",
      type: r.type,
      amount: round2(r.amount),
      frequency: r.interval_count > 1 ? `every ${r.interval_count} ${r.frequency}` : r.frequency,
      next_date: r.next_run_date,
    }))
    .sort((a, b) => a.next_date.localeCompare(b.next_date) || a.name.localeCompare(b.name));
}
