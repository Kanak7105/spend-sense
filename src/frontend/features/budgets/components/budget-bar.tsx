import { OctagonAlert, TriangleAlert } from "lucide-react";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { Progress } from "@/frontend/components/ui/progress";
import { formatMoney } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";
import type { BudgetProgress } from "@/shared/schemas/budgets";

export type BudgetStatus = "ok" | "warning" | "over";

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent >= limit) return "over";
  if (spent >= limit * 0.8) return "warning";
  return "ok";
}

/**
 * Spent vs limit for one budget. Status colours are reserved for status and
 * always come with an icon + label, never colour alone.
 */
export function BudgetBar({
  budget,
  compact = false,
}: {
  budget: BudgetProgress;
  compact?: boolean;
}) {
  const status = budgetStatus(budget.spent, budget.amount);
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spent;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={budget.icon} color={budget.color} size={compact ? "sm" : "md"} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{budget.name}</span>
        <span className="text-sm tabular-nums">
          <span className="font-medium">{formatMoney(budget.spent)}</span>
          <span className="text-muted-foreground"> / {formatMoney(budget.amount)}</span>
        </span>
      </div>
      <Progress
        value={Math.min(pct, 100)}
        aria-label={`${budget.name}: ${Math.round(pct)}% of budget used`}
        className={cn(
          "h-2",
          status === "ok" && "[&>[data-slot=progress-indicator]]:bg-primary",
          status === "warning" && "[&>[data-slot=progress-indicator]]:bg-warning",
          status === "over" && "[&>[data-slot=progress-indicator]]:bg-destructive",
        )}
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {status === "over" && <OctagonAlert className="size-3.5 text-destructive" />}
        {status === "warning" && <TriangleAlert className="size-3.5 text-warning" />}
        {status === "over"
          ? `Over budget by ${formatMoney(-remaining)}`
          : status === "warning"
            ? `${Math.round(pct)}% used · ${formatMoney(remaining)} left`
            : `${formatMoney(remaining)} left · ${Math.round(pct)}% used`}
      </p>
    </div>
  );
}
