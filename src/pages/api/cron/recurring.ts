import { timingSafeEqual } from "node:crypto";

import type { NextApiRequest, NextApiResponse } from "next";

import { createAdminClient } from "@/backend/lib/supabase-admin";
import { todayIST } from "@/shared/lib/dates";

/**
 * Daily job (vercel.json → crons). Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * Uses the secret key to process every user's due recurring transactions.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ ok: false });

  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization ?? "";
  const expected = `Bearer ${secret}`;
  const authorized =
    Boolean(secret) &&
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!authorized) return res.status(401).json({ ok: false });

  const { data, error } = await createAdminClient().rpc("process_due_recurring", {
    p_today: todayIST(),
  });
  if (error) {
    console.error("[cron] recurring failed", error.code, error.message);
    return res.status(500).json({ ok: false });
  }
  return res.status(200).json({ ok: true, created: data });
}
