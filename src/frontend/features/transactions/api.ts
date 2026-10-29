// Client-side wrappers for the transactions API routes.
import { apiRequest } from "@/frontend/lib/api-client";

import type { TransactionInput, TransactionWriteResult } from "@/shared/schemas/transactions";

export const createTransaction = (input: TransactionInput) =>
  apiRequest<TransactionWriteResult>("POST", "/api/transactions", input);

export const updateTransaction = (id: string, input: TransactionInput) =>
  apiRequest<TransactionWriteResult>("PATCH", `/api/transactions/${encodeURIComponent(id)}`, input);

export const deleteTransaction = (id: string) =>
  apiRequest("DELETE", `/api/transactions/${encodeURIComponent(id)}`);
