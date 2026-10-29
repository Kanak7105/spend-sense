import { askAssistant } from "@/backend/features/assistant/mutations";
import { getAssistantRemaining } from "@/backend/features/assistant/queries";
import { apiRoute } from "@/backend/lib/api-route";
import { ok } from "@/shared/lib/action-result";

export default apiRoute({
  GET: async ({ supabase }) => ok({ remaining: await getAssistantRemaining(supabase) }),
  POST: ({ supabase, body }) => askAssistant(supabase, body),
});
