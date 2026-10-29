import { z } from "zod";

/** Questions per user per day (IST). Must stay within consume_ai_credit's 1–100 range. */
export const AI_DAILY_LIMIT = 5;

export const PROMPT_IDS = [
  // Insights
  "monthly-summary",
  "compare-last-month",
  "budget-health",
  "savings-tips",
  "goals-check",
  "spending-trend",
  "upcoming-bills",
  "income-sources",
  "weekday-habits",
  "year-so-far",
  // Just for fun
  "roast-me",
  "money-personality",
  "grade-my-month",
  "chai-math",
  "spending-haiku",
] as const;

export const promptIdSchema = z.enum(PROMPT_IDS);
export type PromptId = z.infer<typeof promptIdSchema>;

/** Chip labels. The prompt text and data each preset uses stay on the server. */
export const PROMPT_LABELS: Record<PromptId, string> = {
  "monthly-summary": "How did I spend this month?",
  "compare-last-month": "Compare with last month",
  "budget-health": "Budget health check",
  "savings-tips": "Where can I save?",
  "goals-check": "Am I on track for my goals?",
  "spending-trend": "Am I spending more lately?",
  "upcoming-bills": "What bills are coming up?",
  "income-sources": "Where does my money come from?",
  "weekday-habits": "Which days do I spend most?",
  "year-so-far": "How's my year going?",
  "roast-me": "Roast my spending 🔥",
  "money-personality": "What's my money personality?",
  "grade-my-month": "Grade my month (A–F)",
  "chai-math": "My spending in cups of chai ☕",
  "spending-haiku": "A haiku about my month",
};

/** How the chips are grouped in the UI. Every id appears in exactly one group. */
export const PROMPT_GROUPS: { label: string; ids: PromptId[] }[] = [
  {
    label: "Insights",
    ids: [
      "monthly-summary",
      "compare-last-month",
      "budget-health",
      "savings-tips",
      "goals-check",
      "spending-trend",
      "upcoming-bills",
      "income-sources",
      "weekday-habits",
      "year-so-far",
    ],
  },
  {
    label: "Just for fun",
    ids: ["roast-me", "money-personality", "grade-my-month", "chai-math", "spending-haiku"],
  },
];

/** The client only ever sends a preset id — never prompt text or data. */
export const assistantRequestSchema = z.object({ promptId: promptIdSchema });
export type AssistantRequest = z.input<typeof assistantRequestSchema>;

export type AssistantAnswer = { content: string; remaining: number; cached: boolean };
