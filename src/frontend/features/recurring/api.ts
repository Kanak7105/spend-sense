// Client-side wrappers for the recurring-transactions API routes.
import { apiRequest } from "@/frontend/lib/api-client";
import type { RecurringInput } from "@/shared/schemas/recurring";

export const createRecurring = (input: RecurringInput) =>
  apiRequest("POST", "/api/recurring", input);

export const updateRecurring = (id: string, input: RecurringInput) =>
  apiRequest("PATCH", `/api/recurring/${encodeURIComponent(id)}`, input);

export const setRecurringActive = (id: string, active: boolean) =>
  apiRequest("POST", `/api/recurring/${encodeURIComponent(id)}/active`, { active });

export const deleteRecurring = (id: string) =>
  apiRequest("DELETE", `/api/recurring/${encodeURIComponent(id)}`);
