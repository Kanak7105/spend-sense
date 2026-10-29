// Server-only: called from API routes. user_id is never taken from the client —
// the column defaults to auth.uid() and RLS rejects rows owned by anyone else.
import { z } from "zod";

import { dbFail } from "@/backend/lib/db-errors";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import type { ServerSupabase } from "@/backend/lib/supabase";

import { accountSchema } from "@/shared/schemas/accounts";

const DUPLICATE_NAME = "You already have an account with this name.";

export async function createAccount(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { name, type, openingBalance, color } = parsed.data;
  const { error } = await supabase
    .from("accounts")
    .insert({ name, type, opening_balance: openingBalance, color });
  if (error) return dbFail(error, { unique: DUPLICATE_NAME });
  return ok();
}

export async function updateAccount(
  supabase: ServerSupabase,
  accountId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(accountId);
  const parsed = accountSchema.safeParse(input);
  if (!parsedId.success) return fail("Account not found.");
  if (!parsed.success) return invalid(parsed.error);

  const { name, type, openingBalance, color } = parsed.data;
  const { data, error } = await supabase
    .from("accounts")
    .update({ name, type, opening_balance: openingBalance, color })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error, { unique: DUPLICATE_NAME });
  if (!data.length) return fail("Account not found.");
  return ok();
}

export async function setAccountArchived(
  supabase: ServerSupabase,
  accountId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(accountId);
  const parsed = z.object({ archived: z.boolean() }).safeParse(input);
  if (!parsedId.success) return fail("Account not found.");
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("accounts")
    .update({ is_archived: parsed.data.archived })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail("Account not found.");
  return ok();
}

export async function deleteAccount(
  supabase: ServerSupabase,
  accountId: string,
): Promise<ActionResult> {
  const parsedId = id.safeParse(accountId);
  if (!parsedId.success) return fail("Account not found.");

  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) {
    return dbFail(error, {
      foreignKey:
        "This account has transactions. Archive it instead, or delete its transactions first.",
    });
  }
  if (!data.length) return fail("Account not found.");
  return ok();
}
