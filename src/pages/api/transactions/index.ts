import { createTransaction } from "@/backend/features/transactions/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createTransaction(supabase, body),
});
