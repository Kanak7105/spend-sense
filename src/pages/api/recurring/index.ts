import { createRecurring } from "@/backend/features/recurring/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createRecurring(supabase, body),
});
