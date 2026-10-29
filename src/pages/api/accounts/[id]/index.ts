import { deleteAccount, updateAccount } from "@/backend/features/accounts/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateAccount(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteAccount(supabase, routeId(req)),
});
