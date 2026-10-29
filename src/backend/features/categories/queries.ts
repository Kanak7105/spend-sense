// Server-only: called from getServerSideProps.
import type { ServerSupabase } from "@/backend/lib/supabase";

export async function listCategories(supabase: ServerSupabase) {
  const { data, error } = await supabase.from("categories").select("*").order("type").order("name");
  if (error) throw new Error("Could not load categories", { cause: error });
  return data;
}
