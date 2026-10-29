import { toast } from "sonner";

import { formatMoney } from "@/frontend/lib/format";
import type { BudgetAlert } from "@/shared/schemas/budgets";

/** In-app alert when a transaction pushes a budget past 80% or 100%. */
export function notifyBudgetAlert(alert: BudgetAlert | null | undefined) {
  if (!alert) return;
  const spent = `${formatMoney(alert.spent)} of ${formatMoney(alert.limit)}`;
  if (alert.level === 100) {
    toast.error(`${alert.category} budget exceeded`, {
      description: `You've spent ${spent} this month.`,
      duration: 8000,
    });
  } else {
    toast.warning(`${alert.category} budget is 80% used`, {
      description: `You've spent ${spent} this month.`,
      duration: 6000,
    });
  }
}
