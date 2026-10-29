import { z } from "zod";

import { id, positiveAmount } from "@/shared/lib/validation";

export const budgetSchema = z.object({
  categoryId: id.or(z.literal("")).refine(Boolean, "Pick a category"),
  amount: positiveAmount,
});

/** The category is fixed once a budget exists; only the limit changes. */
export const budgetUpdateSchema = budgetSchema.pick({ amount: true });

export type BudgetInput = z.input<typeof budgetSchema>;

/** Thresholds that trigger an in-app alert, as fractions of the limit. */
export const BUDGET_ALERT_LEVELS = [0.8, 1] as const;

export type BudgetAlert = {
  category: string;
  /** 80 or 100 — the highest threshold just crossed. */
  level: 80 | 100;
  spent: number;
  limit: number;
};

export type BudgetProgress = {
  budget_id: string;
  category_id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  spent: number;
};
