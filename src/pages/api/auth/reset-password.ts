import { updatePassword } from "@/backend/features/auth/mutations";
import { apiRoute } from "@/backend/lib/api-route";

// Requires the session created by the reset email link (see callback.ts).
export default apiRoute({ POST: ({ supabase, body }) => updatePassword(supabase, body) });
