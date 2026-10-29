import type { PostgrestError } from "@supabase/supabase-js";

import { fail, type ActionResult } from "@/shared/lib/action-result";

/** Map common Postgres errors to user-facing messages; never leak raw DB errors. */
export function dbFail(
  error: PostgrestError,
  messages: Partial<Record<"unique" | "foreignKey" | "check", string>> = {},
): ActionResult<never> {
  switch (error.code) {
    case "23505":
      return fail(messages.unique ?? "That already exists.");
    case "23503":
      return fail(messages.foreignKey ?? "This item is linked to other records.");
    case "23514":
      return fail(messages.check ?? "Some values are not allowed.");
    case "42501":
      return fail("You don't have permission to do that.");
    default:
      console.error("[db]", error.code, error.message);
      return fail("Something went wrong. Please try again.");
  }
}
