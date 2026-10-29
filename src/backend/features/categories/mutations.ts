// Server-only: called from API routes.
import { dbFail } from "@/backend/lib/db-errors";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import type { ServerSupabase } from "@/backend/lib/supabase";

import { categorySchema, categoryUpdateSchema } from "@/shared/schemas/categories";

const DUPLICATE_NAME = "You already have a category with this name.";

export async function createCategory(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await supabase.from("categories").insert(parsed.data);
  if (error) return dbFail(error, { unique: DUPLICATE_NAME });
  return ok();
}

/** Type is fixed after creation, so the update schema omits it. */
export async function updateCategory(
  supabase: ServerSupabase,
  categoryId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(categoryId);
  const parsed = categoryUpdateSchema.safeParse(input);
  if (!parsedId.success) return fail("Category not found.");
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error, { unique: DUPLICATE_NAME });
  if (!data.length) return fail("Category not found.");
  return ok();
}

/** Transactions keep their data and become uncategorised; the category's budget is removed. */
export async function deleteCategory(
  supabase: ServerSupabase,
  categoryId: string,
): Promise<ActionResult> {
  const parsedId = id.safeParse(categoryId);
  if (!parsedId.success) return fail("Category not found.");

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail("Category not found.");
  return ok();
}
