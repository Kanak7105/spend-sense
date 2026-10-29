import { z } from "zod";

import { hexColor, isoDate, positiveAmount, signedAmount } from "@/shared/lib/validation";
import type { Tables } from "@/shared/types/database";

export type SavingsGoal = Tables<"savings_goals">;

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Name your goal").max(60, "Keep it under 60 characters"),
  targetAmount: positiveAmount,
  deadline: z
    .union([z.literal(""), isoDate])
    .nullish()
    .transform((v) => v || null),
  icon: z.string().regex(/^[a-z0-9-]{1,40}$/, "Pick an icon"),
  color: hexColor,
});

export type GoalInput = z.input<typeof goalSchema>;

/** Positive adds money to the goal, negative withdraws it. */
export const goalAdjustSchema = z.object({
  delta: signedAmount.refine((v) => v !== 0, "Amount can't be zero"),
});

export type GoalAdjustInput = z.input<typeof goalAdjustSchema>;
