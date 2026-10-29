import { setRecurringActive } from "@/backend/features/recurring/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ req, supabase, body }) => setRecurringActive(supabase, routeId(req), body),
});
