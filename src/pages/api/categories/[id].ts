import { deleteCategory, updateCategory } from "@/backend/features/categories/mutations";
import { apiRoute, routeId } from "@/backend/lib/api-route";

export default apiRoute({
  PATCH: ({ req, supabase, body }) => updateCategory(supabase, routeId(req), body),
  DELETE: ({ req, supabase }) => deleteCategory(supabase, routeId(req)),
});
