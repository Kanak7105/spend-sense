import { createAccount } from "@/backend/features/accounts/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createAccount(supabase, body),
});
