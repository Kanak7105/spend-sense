import { signUp } from "@/backend/features/auth/mutations";
import { apiRoute } from "@/backend/lib/api-route";
import { getSiteUrl } from "@/backend/lib/site-url";

export default apiRoute(
  { POST: ({ req, supabase, body }) => signUp(supabase, body, getSiteUrl(req)) },
  { auth: false },
);
