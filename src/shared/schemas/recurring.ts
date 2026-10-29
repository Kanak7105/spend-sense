import { z } from "zod";

import { id, isoDate, optionalText, positiveAmount } from "@/shared/lib/validation";
import { Constants, type Tables } from "@/shared/types/database";

import { TRANSACTION_TYPES } from "./transactions";

export const FREQUENCIES = Constants.public.Enums.recurrence_frequency;
export type Frequency = (typeof FREQUENCIES)[number];
export type RecurringRule = Tables<"recurring_rules">;

const optionalId = z
  .union([z.literal(""), z.literal("none"), id])
  .nullish()
  .transform((v) => (v && v !== "none" ? v : null));

export const recurringSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amount: positiveAmount,
    accountId: id.or(z.literal("")).refine(Boolean, "Pick an account"),
    toAccountId: optionalId,
    categoryId: optionalId,
    description: optionalText(200),
    frequency: z.enum(FREQUENCIES),
    intervalCount: z.coerce
      .number({ message: "Enter a number" })
      .int("Whole numbers only")
      .min(1, "At least 1")
      .max(365, "At most 365"),
    startDate: isoDate,
    endDate: z
      .union([z.literal(""), isoDate])
      .nullish()
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (v.type === "transfer") {
      if (!v.toAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccountId"],
          message: "Pick where the money goes",
        });
      } else if (v.toAccountId === v.accountId) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccountId"],
          message: "Pick a different account",
        });
      }
    }
    if (v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Must be after the start date" });
    }
  })
  .transform((v) =>
    v.type === "transfer" ? { ...v, categoryId: null } : { ...v, toAccountId: null },
  );

/** A rule with its category and account(s) embedded, as listed on the page. */
export type RecurringRuleRow = RecurringRule & {
  category: Pick<Tables<"categories">, "id" | "name" | "icon" | "color"> | null;
  account: Pick<Tables<"accounts">, "id" | "name" | "color"> | null;
  to_account: Pick<Tables<"accounts">, "id" | "name" | "color"> | null;
};

export type RecurringInput = z.input<typeof recurringSchema>;
export type RecurringOutput = z.output<typeof recurringSchema>;

const UNIT: Record<Frequency, [string, string]> = {
  daily: ["day", "days"],
  weekly: ["week", "weeks"],
  monthly: ["month", "months"],
  yearly: ["year", "years"],
};

/** "Every month", "Every 2 weeks", … */
export function describeSchedule(frequency: Frequency, interval: number) {
  const [one, many] = UNIT[frequency];
  return interval === 1 ? `Every ${one}` : `Every ${interval} ${many}`;
}
