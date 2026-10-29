import { deleteGoal, updateGoal } from "@/backend/features/goals/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateGoal(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteGoal(supabase, routeId(req)),
});
