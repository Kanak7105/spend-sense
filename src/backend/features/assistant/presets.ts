// Server-only: the assistant's preset questions. Each preset runs only the
// queries it needs and turns them into a compact JSON snapshot for the model.
import type { ServerSupabase } from "@/backend/lib/supabase";
import { monthRange, shiftMonth, type MonthKey } from "@/shared/lib/dates";
import type { PromptId } from "@/shared/schemas/assistant";

import {
  budgetStatus,
  categorySpending,
  goalsStatus,
  incomeSources,
  monthlyTrend,
  periodTotals,
  upcomingRecurring,
  weekdaySpending,
} from "./snapshot";

export type PresetContext = { supabase: ServerSupabase; today: string; month: MonthKey };

type Preset = {
  prompt: string;
  snapshot: (ctx: PresetContext) => Promise<Record<string, unknown>>;
};

/** This month's totals, categories and budgets: enough for the light-hearted presets. */
async function monthAtAGlance({ supabase, month }: PresetContext) {
  const { from, to } = monthRange(month);
  const [totals, categories, budgets] = await Promise.all([
    periodTotals(supabase, from, to),
    categorySpending(supabase, from, to),
    budgetStatus(supabase, month),
  ]);
  return {
    month,
    month_in_progress: true,
    totals,
    spending_by_category: categories,
    // Rupee amounts only: the model misreads "123% used" as "over by 123%" in jokes.
    budgets: budgets.map(({ category, budget, spent, over_budget_by }) => ({
      category,
      budget,
      spent,
      over_budget_by,
    })),
  };
}

const FUN_RULES =
  "Keep it kind and playful, never shaming. Joke about the spending, never about the " +
  "person's body, eating, health or mental health. Use only real numbers from the data. " +
  "If there is little or no data, joke about that instead and suggest adding transactions.";

export const PRESETS: Record<PromptId, Preset> = {
  "monthly-summary": {
    prompt:
      "Summarise how I spent money this month: income vs expenses, net, my top spending " +
      "categories with their share of total spending, and one notable observation.",
    snapshot: async ({ supabase, month }) => {
      const { from, to } = monthRange(month);
      const [totals, categories] = await Promise.all([
        periodTotals(supabase, from, to),
        categorySpending(supabase, from, to),
      ]);
      return { month, month_in_progress: true, totals, spending_by_category: categories };
    },
  },

  "compare-last-month": {
    prompt:
      "Compare this month with last month: income, expenses and net, and which spending " +
      "categories went up or down the most. This month is still in progress — say so if " +
      "it affects the comparison.",
    snapshot: async ({ supabase, month }) => {
      const last = shiftMonth(month, -1);
      const [trend, thisMonth, lastMonth] = await Promise.all([
        monthlyTrend(supabase, month, 2),
        categorySpending(supabase, monthRange(month).from, monthRange(month).to),
        categorySpending(supabase, monthRange(last).from, monthRange(last).to),
      ]);
      return {
        this_month: month,
        last_month: last,
        monthly_totals: trend,
        spending_by_category: { this_month: thisMonth, last_month: lastMonth },
      };
    },
  },

  "budget-health": {
    prompt:
      "Review my budgets for this month. Group them into over budget, close to the limit " +
      "(80% or more) and comfortable, then suggest one concrete action.",
    snapshot: async ({ supabase, month }) => ({
      month,
      month_in_progress: true,
      budgets: await budgetStatus(supabase, month),
    }),
  },

  "savings-tips": {
    prompt:
      "Suggest 3 specific, realistic ways I could save money, based on where my money " +
      "actually goes. Reference real categories and amounts.",
    snapshot: async ({ supabase, month }) => {
      const from = `${shiftMonth(month, -2)}-01`;
      const [trend, categories] = await Promise.all([
        monthlyTrend(supabase, month, 3),
        categorySpending(supabase, from, monthRange(month).to),
      ]);
      return {
        months: [shiftMonth(month, -2), month],
        monthly_totals: trend,
        spending_by_category_last_3_months: categories,
      };
    },
  },

  "goals-check": {
    prompt:
      "For each savings goal, tell me whether I'm on track and how much I'd need to save " +
      "per month to reach it by the deadline. Mention upcoming recurring payments that " +
      "could affect my saving.",
    snapshot: async ({ supabase, today, month }) => {
      const [goals, recurring] = await Promise.all([
        goalsStatus(supabase, month),
        upcomingRecurring(supabase, today),
      ]);
      return { month, savings_goals: goals, recurring_next_30_days: recurring };
    },
  },
  "spending-trend": {
    prompt:
      "Look at my last 6 months. Is my spending going up, down or steady? Point out the " +
      "highest and lowest months and how this month compares with my 6-month average. " +
      "This month is still in progress.",
    snapshot: async ({ supabase, month }) => ({
      this_month: month,
      monthly_totals: await monthlyTrend(supabase, month, 6),
    }),
  },

  "upcoming-bills": {
    prompt:
      "List my recurring payments and income due in the next 30 days, in date order, with " +
      "the total going out and coming in. Flag the biggest payment.",
    snapshot: async ({ supabase, today }) => ({
      today,
      recurring_next_30_days: await upcomingRecurring(supabase, today),
    }),
  },

  "income-sources": {
    prompt:
      "Break down where my income comes from over the last 3 months, with each source's " +
      "share, and say whether my income is steady from month to month.",
    snapshot: async ({ supabase, month }) => {
      const from = `${shiftMonth(month, -2)}-01`;
      const [trend, sources] = await Promise.all([
        monthlyTrend(supabase, month, 3),
        incomeSources(supabase, from, monthRange(month).to),
      ]);
      return { monthly_totals: trend, income_by_category_last_3_months: sources };
    },
  },

  "weekday-habits": {
    prompt:
      "Which days of the week do I spend the most and least on, on average? Point out any " +
      "pattern (e.g. weekends) and give one tip based on it.",
    snapshot: async ({ supabase, today, month }) => {
      const from = `${shiftMonth(month, -2)}-01`;
      return { from, to: today, by_weekday: await weekdaySpending(supabase, from, today) };
    },
  },

  "year-so-far": {
    prompt:
      "Review my year so far: total income, expenses and savings, my best and worst " +
      "months, and the top spending categories for the year.",
    snapshot: async ({ supabase, today, month }) => {
      const from = `${month.slice(0, 4)}-01-01`;
      const months = Number(month.slice(5, 7));
      const [totals, trend, categories] = await Promise.all([
        periodTotals(supabase, from, today),
        monthlyTrend(supabase, month, months),
        categorySpending(supabase, from, today),
      ]);
      return {
        year: month.slice(0, 4),
        totals,
        monthly_totals: trend,
        spending_by_category: categories,
      };
    },
  },

  "roast-me": {
    prompt:
      "Give my spending this month a light-hearted roast, like a friendly stand-up comic: " +
      "3 or 4 short bullet jokes about my real categories and amounts, then one genuinely " +
      "useful tip at the end. " +
      FUN_RULES,
    snapshot: monthAtAGlance,
  },

  "money-personality": {
    prompt:
      "Based on my spending this month, give me a fun money-personality type with a catchy " +
      "name and an emoji (e.g. 'The Weekend Foodie 🍕'), 2–3 bullets on why, and one " +
      "strength and one thing to watch. " +
      FUN_RULES,
    snapshot: monthAtAGlance,
  },

  "grade-my-month": {
    prompt:
      "Grade my month like a report card: an overall letter grade (A–F), then a short " +
      "grade with a one-line comment for Saving, Budgets and Spending balance, and a " +
      "'teacher's note' with one thing to improve. Grade fairly for a month in progress. " +
      FUN_RULES,
    snapshot: monthAtAGlance,
  },

  "chai-math": {
    prompt:
      "Translate my spending this month into fun everyday equivalents in India: cups of " +
      "chai at ₹20, plates of samosa at ₹30, movie tickets at ₹250 and so on. Do 4 or 5 " +
      "playful bullets for my top categories and total, with correct arithmetic. " +
      FUN_RULES,
    snapshot: monthAtAGlance,
  },

  "spending-haiku": {
    prompt:
      "Write one haiku (5-7-5 syllables, three lines, no bullets) about my month's money, " +
      "mentioning my biggest category. Then add one short plain-language line with the " +
      "key number it's about. " +
      FUN_RULES,
    snapshot: monthAtAGlance,
  },
};
