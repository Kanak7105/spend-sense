import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import type { ActionResult } from "@/shared/lib/action-result";

/**
 * Surface a failed Server Action result on a react-hook-form form:
 * field errors go to their inputs, anything else becomes a toast.
 */
export function handleActionError<T extends FieldValues>(
  result: Extract<ActionResult<unknown>, { ok: false }>,
  setError: UseFormSetError<T>,
) {
  const entries = Object.entries(result.fieldErrors ?? {});
  for (const [field, messages] of entries) {
    if (messages?.[0]) setError(field as Path<T>, { type: "server", message: messages[0] });
  }
  if (entries.length === 0) toast.error(result.error);
}
