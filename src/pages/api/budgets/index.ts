import { createBudget } from "@/backend/features/budgets/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createBudget(supabase, body),
});
