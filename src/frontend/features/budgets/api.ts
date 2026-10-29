// Client-side wrappers for the budgets API routes.
import { apiRequest } from "@/frontend/lib/api-client";
import type { BudgetInput } from "@/shared/schemas/budgets";

export const createBudget = (input: BudgetInput) => apiRequest("POST", "/api/budgets", input);

export const updateBudget = (id: string, input: Pick<BudgetInput, "amount">) =>
  apiRequest("PATCH", `/api/budgets/${encodeURIComponent(id)}`, input);

export const deleteBudget = (id: string) =>
  apiRequest("DELETE", `/api/budgets/${encodeURIComponent(id)}`);
