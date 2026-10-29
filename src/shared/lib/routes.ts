export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

// API routes check auth themselves and answer 401 JSON instead of redirecting.
const PUBLIC_PREFIXES = ["/api/"];

export function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    AUTH_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/** Only allow same-origin relative redirects (prevents open redirects via ?next=). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
