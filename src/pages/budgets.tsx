import { Plus, Target } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";

import { listBudgetProgress } from "@/backend/features/budgets/queries";
import { listCategories } from "@/backend/features/categories/queries";
import { withUser } from "@/backend/lib/auth";
import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { Money } from "@/frontend/components/shared/money";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { Progress } from "@/frontend/components/ui/progress";
import { budgetStatus } from "@/frontend/features/budgets/components/budget-bar";
import { BudgetFormDialog } from "@/frontend/features/budgets/components/budget-form-dialog";
import { BudgetList } from "@/frontend/features/budgets/components/budget-list";
import { MonthSwitcher } from "@/frontend/features/insights/components/month-switcher";
import { sumMoney } from "@/frontend/lib/money";
import { cn } from "@/frontend/lib/utils";
import { isMonthKey, monthOf, todayIST } from "@/shared/lib/dates";

export const getServerSideProps = withUser(async ({ ctx, supabase }) => {
  const current = monthOf(todayIST());
  const requested = ctx.query.month;
  const month = isMonthKey(requested) && requested <= current ? requested : current;
  const [budgets, categories] = await Promise.all([
    listBudgetProgress(supabase, month),
    listCategories(supabase),
  ]);
  const budgeted = new Set(budgets.map((b) => b.category_id));
  return {
    month,
    isCurrentMonth: month === current,
    budgets,
    available: categories.filter((c) => c.type === "expense" && !budgeted.has(c.id)),
  };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const BudgetsPage: PageWithLayout<Props> = ({ month, isCurrentMonth, budgets, available }) => {
  const limit = sumMoney(budgets.map((b) => b.amount));
  const spent = sumMoney(budgets.map((b) => b.spent));
  const status = budgetStatus(spent, limit);

  const addButton = (
    <BudgetFormDialog
      categories={available}
      trigger={
        <Button disabled={available.length === 0}>
          <Plus /> Add budget
        </Button>
      }
    />
  );

  return (
    <>
      <PageTitle title="Budgets" />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly limits per category. Alerts at 80% and 100%.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSwitcher month={month} canGoNext={!isCurrentMonth} />
          {addButton}
        </div>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets yet"
          description="Pick a category like Food or Shopping and give it a monthly limit."
          action={addButton}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-sm border border-l-2 border-l-margin-rule bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Spent across budgets</p>
                <p className="text-2xl font-semibold tabular-nums">
                  <Money amount={spent} />
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / <Money amount={limit} className="font-normal" />
                  </span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {limit > 0 ? Math.round((spent / limit) * 100) : 0}% used
              </p>
            </div>
            <Progress
              value={limit > 0 ? Math.min((spent / limit) * 100, 100) : 0}
              aria-label="Total budget used"
              className={cn(
                "mt-3 h-2",
                status === "warning" && "[&>[data-slot=progress-indicator]]:bg-warning",
                status === "over" && "[&>[data-slot=progress-indicator]]:bg-destructive",
              )}
            />
          </div>
          <BudgetList budgets={budgets} />
        </div>
      )}
    </>
  );
};

BudgetsPage.getLayout = appLayout;
export default BudgetsPage;
