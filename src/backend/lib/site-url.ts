// Server-only.
import type { IncomingMessage } from "node:http";

/** Public origin used to build auth redirect URLs. */
export function getSiteUrl(req: IncomingMessage) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  return `${proto}://${host}`;
}
