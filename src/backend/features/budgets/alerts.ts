// Server-only: decides whether a transaction just pushed a budget past 80% / 100%.
import type { ServerSupabase } from "@/backend/lib/supabase";
import { BUDGET_ALERT_LEVELS, type BudgetAlert } from "@/shared/schemas/budgets";
import type { TransactionType } from "@/shared/schemas/transactions";

type Contribution = {
  type: TransactionType;
  categoryId: string | null;
  date: string;
  amount: number;
};

/** How much a transaction counts towards a category's budget in the month of `date`. */
function counts(tx: Contribution | null, categoryId: string, date: string) {
  if (!tx || tx.type !== "expense" || tx.categoryId !== categoryId) return 0;
  return tx.date.slice(0, 7) === date.slice(0, 7) ? tx.amount : 0;
}

/**
 * Call after a write. `after` is the saved transaction, `before` the previous
 * version (for edits). Returns an alert only when a threshold is newly crossed,
 * so the user isn't nagged on every expense once over 80%.
 */
export async function budgetAlertFor(
  supabase: ServerSupabase,
  after: Contribution,
  before: Contribution | null = null,
): Promise<BudgetAlert | null> {
  if (after.type !== "expense" || !after.categoryId) return null;

  const { data, error } = await supabase.rpc("budget_progress", { p_month: after.date });
  if (error) return null; // alerts are best-effort; never fail the write over them
  const budget = data.find((b) => b.category_id === after.categoryId);
  if (!budget) return null;

  const spentAfter = budget.spent;
  const spentBefore =
    spentAfter -
    counts(after, budget.category_id, after.date) +
    counts(before, budget.category_id, after.date);

  for (const level of [...BUDGET_ALERT_LEVELS].reverse()) {
    const threshold = budget.amount * level;
    if (spentBefore < threshold && spentAfter >= threshold) {
      return {
        category: budget.name,
        level: level === 1 ? 100 : 80,
        spent: spentAfter,
        limit: budget.amount,
      };
    }
  }
  return null;
}
