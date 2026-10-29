import { adjustGoal } from "@/backend/features/goals/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ req, supabase, body }) => adjustGoal(supabase, routeId(req), body),
});
