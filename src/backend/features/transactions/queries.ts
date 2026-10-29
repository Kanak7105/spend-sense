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

// Narrow structural type: any transactions select builder with the filter methods we use.
type Filterable = {
  ilike(column: string, pattern: string): Filterable;
  eq(column: string, value: string): Filterable;
  or(filters: string): Filterable;
  is(column: string, value: null): Filterable;
  neq(column: string, value: string): Filterable;
  gte(column: string, value: string): Filterable;
  lte(column: string, value: string): Filterable;
};

function applyFilters<Q extends Filterable>(query: Q, filters: TransactionFilters): Q {
  let q: Filterable = query;
  if (filters.q) q = q.ilike("description", `%${likeEscape(filters.q)}%`);
  if (filters.type) q = q.eq("type", filters.type);
  // Ids are zod-validated UUIDs, so interpolating them into the or() filter is safe.
  if (filters.account) {
    q = q.or(`account_id.eq.${filters.account},to_account_id.eq.${filters.account}`);
  }
  if (filters.category === "none") q = q.is("category_id", null).neq("type", "transfer");
  else if (filters.category) q = q.eq("category_id", filters.category);
  if (filters.from) q = q.gte("date", filters.from);
  if (filters.to) q = q.lte("date", filters.to);
  return q as Q;
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

  query = applyFilters(query, filters);

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

/** Income/expense totals for the same filters as the list (all pages). */
export async function getTransactionTotals(supabase: ServerSupabase, filters: TransactionFilters) {
  const { data, error } = await supabase.rpc("transaction_totals", {
    p_q: filters.q || undefined,
    p_type: filters.type,
    p_account: filters.account,
    p_category: filters.category && filters.category !== "none" ? filters.category : undefined,
    p_uncategorized: filters.category === "none",
    p_from: filters.from,
    p_to: filters.to,
  });
  if (error) throw new Error("Could not load totals", { cause: error });
  const row = data[0] ?? { income: 0, expense: 0, tx_count: 0 };
  return { income: row.income, expense: row.expense, count: row.tx_count };
}

const EXPORT_BATCH = 1000;
const EXPORT_MAX = 50_000;

/** Every transaction matching the filters, oldest first, for CSV/PDF export. */
export async function listAllTransactions(supabase: ServerSupabase, filters: TransactionFilters) {
  const rows: TransactionRow[] = [];
  for (let from = 0; from < EXPORT_MAX; from += EXPORT_BATCH) {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })
      .range(from, from + EXPORT_BATCH - 1);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw new Error("Could not export transactions", { cause: error });
    rows.push(...(data satisfies TransactionRow[]));
    if (data.length < EXPORT_BATCH) break;
  }
  return rows;
}

export async function listRecentTransactions(supabase: ServerSupabase, limit = 5) {
  const { rows } = await listTransactions(supabase, { pageSize: Math.max(limit, 10) });
  return rows.slice(0, limit);
}
