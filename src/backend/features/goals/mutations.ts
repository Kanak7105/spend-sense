// Server-only: called from API routes.
import { dbFail } from "@/backend/lib/db-errors";
import type { ServerSupabase } from "@/backend/lib/supabase";
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import { id } from "@/shared/lib/validation";
import { goalAdjustSchema, goalSchema } from "@/shared/schemas/goals";

const NOT_FOUND = "Goal not found.";

export async function createGoal(supabase: ServerSupabase, input: unknown): Promise<ActionResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { name, targetAmount, deadline, icon, color } = parsed.data;
  const { error } = await supabase
    .from("savings_goals")
    .insert({ name, target_amount: targetAmount, deadline, icon, color });
  if (error) return dbFail(error);
  return ok();
}

export async function updateGoal(
  supabase: ServerSupabase,
  goalId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsedId = id.safeParse(goalId);
  const parsed = goalSchema.safeParse(input);
  if (!parsedId.success) return fail(NOT_FOUND);
  if (!parsed.success) return invalid(parsed.error);

  const { name, targetAmount, deadline, icon, color } = parsed.data;
  const { data, error } = await supabase
    .from("savings_goals")
    .update({ name, target_amount: targetAmount, deadline, icon, color })
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail(NOT_FOUND);
  return ok();
}

/** Add (positive) or withdraw (negative) money atomically in the database. */
export async function adjustGoal(
  supabase: ServerSupabase,
  goalId: string,
  input: unknown,
): Promise<ActionResult<{ saved: number }>> {
  const parsedId = id.safeParse(goalId);
  const parsed = goalAdjustSchema.safeParse(input);
  if (!parsedId.success) return fail(NOT_FOUND);
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase.rpc("adjust_goal_saved", {
    p_goal_id: parsedId.data,
    p_delta: parsed.data.delta,
  });
  if (error) return dbFail(error, { check: "You can't withdraw more than you've saved." });
  if (data === null) return fail(NOT_FOUND);
  return ok({ saved: data });
}

export async function deleteGoal(supabase: ServerSupabase, goalId: string): Promise<ActionResult> {
  const parsedId = id.safeParse(goalId);
  if (!parsedId.success) return fail(NOT_FOUND);

  const { data, error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", parsedId.data)
    .select("id");
  if (error) return dbFail(error);
  if (!data.length) return fail(NOT_FOUND);
  return ok();
}
