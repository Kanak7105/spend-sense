// Client-side wrappers for the categories API routes.
import { apiRequest } from "@/frontend/lib/api-client";

import type { CategoryInput } from "@/shared/schemas/categories";

export const createCategory = (input: CategoryInput) =>
  apiRequest("POST", "/api/categories", input);

export const updateCategory = (id: string, input: Omit<CategoryInput, "type">) =>
  apiRequest("PATCH", `/api/categories/${encodeURIComponent(id)}`, input);

export const deleteCategory = (id: string) =>
  apiRequest("DELETE", `/api/categories/${encodeURIComponent(id)}`);
