// Server-only. Bypasses RLS — use ONLY for trusted jobs (the recurring cron).
import { createClient } from "@supabase/supabase-js";

import { env } from "@/shared/lib/env";
import type { Database } from "@/shared/types/database";

export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient<Database>(env.supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
