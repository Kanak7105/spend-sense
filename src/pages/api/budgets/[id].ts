import { deleteBudget, updateBudget } from "@/backend/features/budgets/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateBudget(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteBudget(supabase, routeId(req)),
});
