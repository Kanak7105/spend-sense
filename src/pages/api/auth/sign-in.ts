import { signIn } from "@/backend/features/auth/mutations";
import { apiRoute } from "@/backend/lib/api-route";

export default apiRoute({ POST: ({ supabase, body }) => signIn(supabase, body) }, { auth: false });
