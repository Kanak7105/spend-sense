import type { z } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
      /** HTTP status for the response; defaults to 400. */
      status?: number;
    };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, status?: number): ActionResult<never> {
  return status ? { ok: false, error, status } : { ok: false, error };
}

export function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}
