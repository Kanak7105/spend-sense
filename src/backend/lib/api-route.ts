// Server-only: helpers for API routes under src/pages/api.
import type { NextApiRequest, NextApiResponse } from "next";

import type { ActionResult } from "@/shared/lib/action-result";

import { getUser, type SessionUser } from "./auth";
import { createClient, type ServerSupabase } from "./supabase";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type Context<Authed extends boolean> = {
  req: NextApiRequest;
  res: NextApiResponse;
  supabase: ServerSupabase;
  user: Authed extends true ? SessionUser : SessionUser | null;
  /** Parsed JSON body (unknown — always validate with Zod). */
  body: unknown;
};

type Handler<Authed extends boolean> = (ctx: Context<Authed>) => Promise<ActionResult<unknown>>;

/**
 * Wraps an API route: method dispatch, same-origin (CSRF) check for writes,
 * auth check, and a uniform ActionResult JSON response. Handlers must validate
 * `body` with the feature's Zod schema and never trust a client-sent user id.
 */
export function apiRoute<Authed extends boolean = true>(
  handlers: Partial<Record<Method, Handler<Authed>>>,
  options: { auth?: Authed } = {},
) {
  const requireAuth = options.auth ?? true;

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Cache-Control", "private, no-store");
    const method = req.method as Method;
    const fn = handlers[method];
    if (!fn) {
      res.setHeader("Allow", Object.keys(handlers).join(", "));
      return res.status(405).json({ ok: false, error: "Method not allowed." });
    }

    if (method !== "GET" && !isSameOrigin(req)) {
      return res.status(403).json({ ok: false, error: "Forbidden." });
    }

    const supabase = createClient(req, res);
    const user = await getUser(supabase);
    if (requireAuth && !user) {
      return res
        .status(401)
        .json({ ok: false, error: "Your session expired. Please sign in again." });
    }

    try {
      const result = await fn({ req, res, supabase, user: user as SessionUser, body: req.body });
      return res.status(result.ok ? 200 : 400).json(result);
    } catch (error) {
      console.error(`[api] ${method} ${req.url}`, error);
      return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
    }
  };
}

/** Browsers always send Origin on non-GET fetches; it must match this host. */
function isSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === String(host).split(",")[0].trim();
  } catch {
    return false;
  }
}

/** Single string id from a dynamic route segment. */
export function routeId(req: NextApiRequest) {
  const { id } = req.query;
  return typeof id === "string" ? id : "";
}
