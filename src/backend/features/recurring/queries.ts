// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";
import type { RecurringRuleRow } from "@/shared/schemas/recurring";

export async function listRecurringRules(supabase: ServerSupabase) {
  const { data, error } = await supabase
    .from("recurring_rules")
    .select(
      `*,
      category:categories (id, name, icon, color),
      account:accounts!recurring_rules_account_id_user_id_fkey (id, name, color),
      to_account:accounts!recurring_rules_to_account_id_user_id_fkey (id, name, color)`,
    )
    .order("is_active", { ascending: false })
    .order("next_run_date");
  if (error) throw new Error("Could not load recurring transactions", { cause: error });
  const rows: RecurringRuleRow[] = data;
  return rows;
}

/**
 * Creates any of the signed-in user's recurring transactions that are due
 * (RLS limits it to their rules). Run before pages that show transactions so
 * the app is correct even if the daily cron hasn't run yet. Best-effort.
 */
export async function catchUpRecurring(supabase: ServerSupabase) {
  const { error } = await supabase.rpc("process_due_recurring");
  if (error) console.error("[recurring] catch-up failed", error.code, error.message);
}
