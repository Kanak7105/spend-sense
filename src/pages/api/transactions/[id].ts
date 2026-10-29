import { deleteTransaction, updateTransaction } from "@/backend/features/transactions/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateTransaction(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteTransaction(supabase, routeId(req)),
});
