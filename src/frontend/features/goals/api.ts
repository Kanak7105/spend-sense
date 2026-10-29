// Client-side wrappers for the savings-goals API routes.
import { apiRequest } from "@/frontend/lib/api-client";
import type { GoalAdjustInput, GoalInput } from "@/shared/schemas/goals";

export const createGoal = (input: GoalInput) => apiRequest("POST", "/api/goals", input);

export const updateGoal = (id: string, input: GoalInput) =>
  apiRequest("PATCH", `/api/goals/${encodeURIComponent(id)}`, input);

export const adjustGoal = (id: string, input: GoalAdjustInput) =>
  apiRequest<{ saved: number }>("POST", `/api/goals/${encodeURIComponent(id)}/adjust`, input);

export const deleteGoal = (id: string) =>
  apiRequest("DELETE", `/api/goals/${encodeURIComponent(id)}`);
