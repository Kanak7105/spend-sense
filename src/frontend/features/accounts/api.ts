// Client-side wrappers for the accounts API routes.
import { apiRequest } from "@/frontend/lib/api-client";

import type { AccountInput } from "@/shared/schemas/accounts";

export const createAccount = (input: AccountInput) => apiRequest("POST", "/api/accounts", input);

export const updateAccount = (id: string, input: AccountInput) =>
  apiRequest("PATCH", `/api/accounts/${encodeURIComponent(id)}`, input);

export const setAccountArchived = (id: string, archived: boolean) =>
  apiRequest("POST", `/api/accounts/${encodeURIComponent(id)}/archive`, { archived });

export const deleteAccount = (id: string) =>
  apiRequest("DELETE", `/api/accounts/${encodeURIComponent(id)}`);
