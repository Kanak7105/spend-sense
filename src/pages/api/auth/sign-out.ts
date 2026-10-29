import { ok } from "@/shared/lib/action-result";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute(
  {
    POST: async ({ supabase }) => {
      await supabase.auth.signOut();
      return ok();
    },
  },
  { auth: false },
);
