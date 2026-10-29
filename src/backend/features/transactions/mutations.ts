// Server-only: called from API routes.
import { dbFail } from "@/backend/lib/db-errors";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import type { ServerSupabase } from "@/backend/lib/supabase";

import { transactionSchema, type TransactionOutput } from "@/shared/schemas/transactions";

const FK_MESSAGE = "That account or category no longer exists.";
const WRONG_CATEGORY = "That category doesn't match the transaction type.";

/** Composite FKs guarantee ownership; this checks the category fits the transaction type. */
async function categoryMatchesType(supabase: ServerSupabase, categoryId: string, type: string) {
  const { data } = await supabase
    .from("categories")
    .select("type")
    .eq("id", categoryId)
    .maybeSingle();
  return data?.type === type;
}

function toRow(v: TransactionOutput) {
  return {
    type: v.type,
    amount: v.amount,
    account_id: v.accountId,
    to_account_id: v.toAccountId,
    category_id: v.categoryId,
    date: v.date,
    description: v.description,
    notes: v.notes,
  };
}

export async function createTransaction(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  if (v.categoryId && !(await categoryMatchesType(supabase, v.categoryId, v.type))) {
    return fail(WRONG_CATEGORY);
  }

  const { error } = await supabase.from("transactions").insert(toRow(v));
  if (error) return dbFail(error, { foreignKey: FK_MESSAGE });
  return ok();
}

export async function updateTransaction(
  supabase: ServerSupabase,
  transactionId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(transactionId);
  const parsed = transactionSchema.safeParse(input);
  if (!parsedId.success) return fail("Transaction not found.");
  if (!parsed.success) return invalid(parsed.error);

  const v = parsed.data;
  if (v.categoryId && !(await categoryMatchesType(supabase, v.categoryId, v.type))) {
    return fail(WRONG_CATEGORY);
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(toRow(v))
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error, { foreignKey: FK_MESSAGE });
  if (!data.length) return fail("Transaction not found.");
  return ok();
}

export async function deleteTransaction(
  supabase: ServerSupabase,
  transactionId: string,
): Promise<ActionResult> {
  const parsedId = id.safeParse(transactionId);
  if (!parsedId.success) return fail("Transaction not found.");

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail("Transaction not found.");
  return ok();
}
