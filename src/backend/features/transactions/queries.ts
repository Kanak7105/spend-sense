// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";
import type { TransactionRow } from "@/shared/types/transaction";

import type { TransactionFilters } from "@/shared/schemas/transactions";

const DEFAULT_PAGE_SIZE = 30;

// Two FKs point at accounts, so the embeds name the constraint explicitly.
const TRANSACTION_SELECT = `
  id, type, amount, date, description, notes, account_id, to_account_id, category_id, created_at,
  category:categories (id, name, icon, color),
  account:accounts!transactions_account_id_user_id_fkey (id, name, color),
  to_account:accounts!transactions_to_account_id_user_id_fkey (id, name, color)
`;

/** Escape LIKE wildcards so user input matches literally. */
function likeEscape(input: string) {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listTransactions(supabase: ServerSupabase, filters: TransactionFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const fromRow = (page - 1) * pageSize;

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT, { count: "exact" })
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(fromRow, fromRow + pageSize - 1);

  if (filters.q) query = query.ilike("description", `%${likeEscape(filters.q)}%`);
  if (filters.type) query = query.eq("type", filters.type);
  // Ids are zod-validated UUIDs, so interpolating them into the or() filter is safe.
  if (filters.account) {
    query = query.or(`account_id.eq.${filters.account},to_account_id.eq.${filters.account}`);
  }
  if (filters.category === "none") query = query.is("category_id", null).neq("type", "transfer");
  else if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);

  const { data, count, error } = await query;
  if (error) throw new Error("Could not load transactions", { cause: error });

  // Typed against the shared contract so a select change can't silently break the UI.
  const rows: TransactionRow[] = data;
  return {
    rows,
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function listRecentTransactions(supabase: ServerSupabase, limit = 5) {
  const { rows } = await listTransactions(supabase, { pageSize: Math.max(limit, 10) });
  return rows.slice(0, limit);
}
