import { z } from "zod";

/** Largest value numeric(12,2) can hold. */
export const MAX_AMOUNT = 9_999_999_999.99;

/**
 * Money entered as text ("1,250.50") → number rounded to paise.
 * Amounts are numeric(12,2) in Postgres; a 2-decimal value round-trips
 * through a JS number exactly, so nothing is lost on the way to the DB.
 */
function moneyField(opts: { allowZero: boolean; allowNegative: boolean }) {
  return z.union([z.string(), z.number()]).transform((v, ctx) => {
    const raw = typeof v === "number" ? String(v) : v.replace(/[,\s₹]/g, "");
    const pattern = opts.allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/;
    if (!pattern.test(raw)) {
      ctx.addIssue({ code: "custom", message: "Enter a valid amount (max 2 decimals)" });
      return z.NEVER;
    }
    const n = Math.round(Number(raw) * 100) / 100;
    if (Math.abs(n) > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "Amount is too large" });
      return z.NEVER;
    }
    if (!opts.allowZero && n <= 0) {
      ctx.addIssue({ code: "custom", message: "Amount must be greater than 0" });
      return z.NEVER;
    }
    return n;
  });
}

export const positiveAmount = moneyField({ allowZero: false, allowNegative: false });
/** Opening balances may be zero or negative (e.g. a credit card that already has dues). */
export const signedAmount = moneyField({ allowZero: true, allowNegative: true });

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour");

export const isoDate = z.iso.date({ message: "Pick a valid date" });

export const id = z.uuid({ message: "Invalid id" });

/** Trimmed optional text; empty string becomes null. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));
}
