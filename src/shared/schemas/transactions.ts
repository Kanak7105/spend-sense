import { z } from "zod";

import { id, isoDate, optionalText, positiveAmount } from "@/shared/lib/validation";
import { Constants } from "@/shared/types/database";

export const TRANSACTION_TYPES = Constants.public.Enums.transaction_type;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Select values: "" (not chosen) or "none" (explicitly uncategorised) both mean null. */
const optionalId = z
  .union([z.literal(""), z.literal("none"), id])
  .nullish()
  .transform((v) => (v && v !== "none" ? v : null));

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: positiveAmount,
    accountId: id.or(z.literal("")).refine(Boolean, "Pick an account"),
    toAccountId: optionalId,
    categoryId: optionalId,
    date: isoDate,
    description: optionalText(200),
    notes: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "transfer") return;
    if (!v.toAccountId) {
      ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick where the money goes" });
    } else if (v.toAccountId === v.accountId) {
      ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick a different account" });
    }
  })
  // Normalise to the DB's shape: transfers have no category, others no destination.
  .transform((v) =>
    v.type === "transfer" ? { ...v, categoryId: null } : { ...v, toAccountId: null },
  );

export type TransactionInput = z.input<typeof transactionSchema>;
/** Parsed values are themselves valid input, so the client can send them as-is. */
export type TransactionOutput = z.output<typeof transactionSchema>;

// ---------------------------------------------------------------- list filters

const PAGE_SIZE_MAX = 100;

/** URL search params → validated filters. Invalid values are dropped, never thrown. */
export const transactionFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(TRANSACTION_TYPES).optional().catch(undefined),
  account: id.optional().catch(undefined),
  category: z
    .union([id, z.literal("none")])
    .optional()
    .catch(undefined),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(10).max(PAGE_SIZE_MAX).optional().catch(undefined),
});

export type TransactionFilters = z.output<typeof transactionFiltersSchema>;

export const FILTER_KEYS = ["q", "type", "account", "category", "from", "to"] as const;

export function parseTransactionFilters(
  params: Record<string, string | string[] | undefined>,
): TransactionFilters {
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]),
  );
  return transactionFiltersSchema.parse(flat);
}
