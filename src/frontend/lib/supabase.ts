import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/lib/env";
import type { Database } from "@/shared/types/database";

/** Supabase client for Client Components. */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
}
