// Server-only: called from API routes. next_run_date is computed by a DB trigger.
import { z } from "zod";

import { dbFail } from "@/backend/lib/db-errors";
import type { ServerSupabase } from "@/backend/lib/supabase";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import { recurringSchema, type RecurringOutput } from "@/shared/schemas/recurring";

const FK_MESSAGE = "That account or category no longer exists.";
const NOT_FOUND = "Recurring transaction not found.";

function toRow(v: RecurringOutput) {
  return {
    type: v.type,
    amount: v.amount,
    account_id: v.accountId,
    to_account_id: v.toAccountId,
    category_id: v.categoryId,
    description: v.description,
    frequency: v.frequency,
    interval_count: v.intervalCount,
    start_date: v.startDate,
    end_date: v.endDate,
  };
}

async function categoryMatches(supabase: ServerSupabase, v: RecurringOutput) {
  if (!v.categoryId) return true;
  const { data } = await supabase
    .from("categories")
    .select("type")
    .eq("id", v.categoryId)
    .maybeSingle();
  return data?.type === v.type;
}

export async function createRecurring(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await categoryMatches(supabase, parsed.data))) {
    return fail("That category doesn't match the transaction type.");
  }

  const { error } = await supabase.from("recurring_rules").insert(toRow(parsed.data));
  if (error) return dbFail(error, { foreignKey: FK_MESSAGE });
  return ok();
}

export async function updateRecurring(
  supabase: ServerSupabase,
  ruleId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(ruleId);
  const parsed = recurringSchema.safeParse(input);
  if (!parsedId.success) return fail(NOT_FOUND);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await categoryMatches(supabase, parsed.data))) {
    return fail("That category doesn't match the transaction type.");
  }

  const { data, error } = await supabase
    .from("recurring_rules")
    .update(toRow(parsed.data))
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error, { foreignKey: FK_MESSAGE });
  if (!data.length) return fail(NOT_FOUND);
  return ok();
}

export async function setRecurringActive(
  supabase: ServerSupabase,
  ruleId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(ruleId);
  const parsed = z.object({ active: z.boolean() }).safeParse(input);
  if (!parsedId.success) return fail(NOT_FOUND);
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("recurring_rules")
    .update({ is_active: parsed.data.active })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail(NOT_FOUND);
  return ok();
}

/** Already-created transactions are kept; they just lose the link to the rule. */
export async function deleteRecurring(
  supabase: ServerSupabase,
  ruleId: string,
): Promise<ActionResult> {
  const parsedId = id.safeParse(ruleId);
  if (!parsedId.success) return fail(NOT_FOUND);

  const { data, error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail(NOT_FOUND);
  return ok();
}
