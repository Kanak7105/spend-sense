// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";

export async function listGoals(supabase: ServerSupabase) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at");
  if (error) throw new Error("Could not load savings goals", { cause: error });
  return data;
}
