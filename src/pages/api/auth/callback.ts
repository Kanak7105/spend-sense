import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

import { safeNextPath } from "@/shared/lib/routes";
import { createClient } from "@/backend/lib/supabase";

/**
 * Lands OAuth sign-ins (?code=) and email links (?code= with PKCE, or
 * ?token_hash=&type= with custom email templates), then redirects to ?next=.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const param = (key: string) => (typeof req.query[key] === "string" ? req.query[key] : null);
  const code = param("code");
  const tokenHash = param("token_hash");
  const type = param("type") as EmailOtpType | null;
  const next = safeNextPath(param("next"));

  const supabase = createClient(req, res);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return res.redirect(303, next);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return res.redirect(303, next);
  }

  return res.redirect(303, "/login?error=auth_callback");
}
