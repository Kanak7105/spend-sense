import { setAccountArchived } from "@/backend/features/accounts/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ req, supabase, body }) => setAccountArchived(supabase, routeId(req), body),
});
