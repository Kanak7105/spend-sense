// Server-only: import from getServerSideProps and API routes, never from components.
import type { IncomingMessage, ServerResponse } from "node:http";

import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

import { env } from "@/shared/lib/env";
import type { Database } from "@/shared/types/database";

export type ServerSupabase = ReturnType<typeof createClient>;

/** Supabase client bound to one request/response (getServerSideProps, API routes). */
export function createClient(req: IncomingMessage, res: ServerResponse) {
  return createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? "");
      },
      setAll(cookiesToSet, headers) {
        if (res.headersSent) return;
        const existing = res.getHeader("Set-Cookie");
        const previous = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
        res.setHeader("Set-Cookie", [
          ...previous,
          ...cookiesToSet.map(({ name, value, options }) =>
            serializeCookieHeader(name, value, options),
          ),
        ]);
        Object.entries(headers ?? {}).forEach(([key, value]) => res.setHeader(key, value));
      },
    },
  });
}
