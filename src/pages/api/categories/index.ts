import { createCategory } from "@/backend/features/categories/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({
  POST: ({ supabase, body }) => createCategory(supabase, body),
});
