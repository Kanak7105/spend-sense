// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";

/** All of the user's accounts, archived last. Callers filter on is_archived. */
export async function listAccounts(supabase: ServerSupabase) {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("is_archived")
    .order("created_at");
  if (error) throw new Error("Could not load accounts", { cause: error });
  return data;
}
