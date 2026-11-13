import type { NextRequest } from "next/server";

import { updateSession } from "@/backend/lib/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals, static assets and the PWA files (sw.js, offline.html)
    // — those must load for signed-out visitors too, not redirect to /login.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$).*)",
  ],
};
