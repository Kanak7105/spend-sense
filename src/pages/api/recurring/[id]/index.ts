import { deleteRecurring, updateRecurring } from "@/backend/features/recurring/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateRecurring(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteRecurring(supabase, routeId(req)),
});
