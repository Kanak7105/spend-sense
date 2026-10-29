// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";
import type { MonthKey } from "@/shared/lib/dates";
import type { BudgetProgress } from "@/shared/schemas/budgets";

/** Every budget with what was spent in the given month. */
export async function listBudgetProgress(
  supabase: ServerSupabase,
  month: MonthKey,
): Promise<BudgetProgress[]> {
  const { data, error } = await supabase.rpc("budget_progress", { p_month: `${month}-01` });
  if (error) throw new Error("Could not load budgets", { cause: error });
  return data;
}
