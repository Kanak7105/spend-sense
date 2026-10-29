// Server-only: called from API routes.
import { fail, invalid, ok, type ActionResult } from "@/shared/lib/action-result";
import type { ServerSupabase } from "@/backend/lib/supabase";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/shared/schemas/auth";

export async function signIn(supabase: ServerSupabase, input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail("Please confirm your email first — check your inbox.");
    }
    return fail("Incorrect email or password.");
  }
  return ok();
}

export async function signUp(
  supabase: ServerSupabase,
  input: unknown,
  siteUrl: string,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/api/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return fail(error.message);
    if (error.code === "over_email_send_rate_limit") {
      return fail("Too many attempts. Please wait a minute and try again.");
    }
    console.error("[auth] signUp", error.code, error.message);
    return fail("Could not create your account. Please try again.");
  }
  return ok({ needsConfirmation: !data.session });
}

export async function requestPasswordReset(
  supabase: ServerSupabase,
  input: unknown,
  siteUrl: string,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
  });
  // Same response whether or not the email exists (no account enumeration).
  if (error) console.error("[auth] resetPasswordForEmail", error.code, error.message);
  return ok();
}

export async function updatePassword(
  supabase: ServerSupabase,
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return fail("Choose a different password.");
    return fail("Could not update your password. Request a new reset link.");
  }
  return ok();
}
