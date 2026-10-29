// Server-only: called from API routes.
import { dbFail } from "@/backend/lib/db-errors";
import type { ServerSupabase } from "@/backend/lib/supabase";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import { budgetSchema, budgetUpdateSchema } from "@/shared/schemas/budgets";

export async function createBudget(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { data: category } = await supabase
    .from("categories")
    .select("type")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();
  if (category?.type !== "expense") return fail("Budgets can only be set on expense categories.");

  const { error } = await supabase
    .from("budgets")
    .insert({ category_id: parsed.data.categoryId, amount: parsed.data.amount });
  if (error) {
    return dbFail(error, {
      unique: "This category already has a budget — edit that one instead.",
      foreignKey: "That category no longer exists.",
    });
  }
  return ok();
}

export async function updateBudget(
  supabase: ServerSupabase,
  budgetId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(budgetId);
  const parsed = budgetUpdateSchema.safeParse(input);
  if (!parsedId.success) return fail("Budget not found.");
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("budgets")
    .update({ amount: parsed.data.amount })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail("Budget not found.");
  return ok();
}

export async function deleteBudget(
  supabase: ServerSupabase,
  budgetId: string,
): Promise<ActionResult> {
  const parsedId = id.safeParse(budgetId);
  if (!parsedId.success) return fail("Budget not found.");

  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail("Budget not found.");
  return ok();
}
