import { z } from "zod";

import { hexColor, signedAmount } from "@/shared/lib/validation";
import { Constants, type Tables } from "@/shared/types/database";

export const ACCOUNT_TYPES = Constants.public.Enums.account_type;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type Account = Tables<"accounts">;

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Give the account a name").max(50, "Keep it under 50 characters"),
  type: z.enum(ACCOUNT_TYPES, { message: "Pick an account type" }),
  openingBalance: signedAmount,
  color: hexColor,
});

export type AccountInput = z.input<typeof accountSchema>;
