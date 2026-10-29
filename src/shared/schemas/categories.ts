import { z } from "zod";

import { hexColor } from "@/shared/lib/validation";
import { Constants, type Tables } from "@/shared/types/database";

export const CATEGORY_TYPES = Constants.public.Enums.category_type;
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type Category = Tables<"categories">;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Give the category a name").max(40, "Keep it under 40 characters"),
  type: z.enum(CATEGORY_TYPES),
  // Same constraint as the DB; the UI only offers icons from CATEGORY_ICONS.
  icon: z.string().regex(/^[a-z0-9-]{1,40}$/, "Pick an icon"),
  color: hexColor,
});

/** Type is fixed after creation so existing transactions stay consistent. */
export const categoryUpdateSchema = categorySchema.omit({ type: true });

export type CategoryInput = z.input<typeof categorySchema>;
