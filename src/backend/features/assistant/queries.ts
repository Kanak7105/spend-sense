// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";
import { todayIST } from "@/shared/lib/dates";
import { AI_DAILY_LIMIT } from "@/shared/schemas/assistant";

/** Questions the signed-in user has left today (IST). */
export async function getAssistantRemaining(supabase: ServerSupabase) {
  const { data, error } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("day", todayIST())
    .maybeSingle();
  if (error) throw new Error("Could not load assistant usage", { cause: error });
  return Math.max(AI_DAILY_LIMIT - (data?.count ?? 0), 0);
}
