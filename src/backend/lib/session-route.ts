// Server-only: auth for API routes that stream files (CSV/PDF) instead of JSON.
import type { NextApiRequest, NextApiResponse } from "next";

import { getUser, type SessionUser } from "./auth";
import { createClient, type ServerSupabase } from "./supabase";

type Handler = (ctx: {
  req: NextApiRequest;
  res: NextApiResponse;
  supabase: ServerSupabase;
  user: SessionUser;
}) => Promise<void>;

/** GET-only, signed-in-only file download route. */
export function downloadRoute(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end();
    }
    const supabase = createClient(req, res);
    const user = await getUser(supabase);
    if (!user) return res.status(401).end("Sign in to download this file.");
    try {
      await handler({ req, res, supabase, user });
    } catch (error) {
      console.error(`[download] ${req.url}`, error);
      if (!res.headersSent) res.status(500).end("Could not generate the file.");
    }
  };
}

/** Content-Disposition header value for a safe ASCII filename. */
export function attachment(filename: string) {
  return `attachment; filename="${filename.replace(/[^\w.-]/g, "_")}"`;
}
