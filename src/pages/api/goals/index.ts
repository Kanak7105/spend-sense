import { createGoal } from "@/backend/features/goals/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createGoal(supabase, body),
});
