import { ArrowRight, FileDown, ReceiptText, Target } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";
import Link from "next/link";

import { listAccounts } from "@/backend/features/accounts/queries";
import { getDashboardData } from "@/backend/features/insights/queries";
import { catchUpRecurring } from "@/backend/features/recurring/queries";
import { listRecentTransactions } from "@/backend/features/transactions/queries";
import { withUser } from "@/backend/lib/auth";
import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { Money } from "@/frontend/components/shared/money";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ACCOUNT_TYPE_META } from "@/frontend/features/accounts/meta";
import { AssistantCard } from "@/frontend/features/assistant/components/assistant-card";
import { BudgetBar } from "@/frontend/features/budgets/components/budget-bar";
import { CategoryDonut } from "@/frontend/features/insights/components/category-donut";
import { MonthSwitcher, monthLabel } from "@/frontend/features/insights/components/month-switcher";
import { PeriodPicker, periodLabel } from "@/frontend/features/insights/components/period-picker";
import { SpendingHeatmap } from "@/frontend/features/insights/components/spending-heatmap";
import { StatTiles } from "@/frontend/features/insights/components/stat-tiles";
import { TrendChart } from "@/frontend/features/insights/components/trend-chart";
import { formatShortDate } from "@/frontend/lib/format";
import { sumMoney } from "@/frontend/lib/money";
import { todayIST, type MonthKey } from "@/shared/lib/dates";
import { parsePeriod, periodDays } from "@/shared/lib/period";
import type { Account } from "@/shared/schemas/accounts";
import type { BudgetProgress } from "@/shared/schemas/budgets";
import type { TransactionRow } from "@/shared/types/transaction";

export const getServerSideProps = withUser(async ({ ctx, supabase }) => {
  await catchUpRecurring(supabase);
  const period = parsePeriod(ctx.query, todayIST());

  const [insights, accounts, recent] = await Promise.all([
    getDashboardData(supabase, period),
    listAccounts(supabase),
    listRecentTransactions(supabase, 6),
  ]);
  return { insights, accounts: accounts.filter((a) => !a.is_archived), recent };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const DashboardPage: PageWithLayout<Props> = ({ insights, accounts, recent }) => {
  const { period } = insights;
  const label = periodLabel(period);

  return (
    <>
      <PageTitle title="Dashboard" />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your money at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {period.month && (
            <MonthSwitcher month={period.month} canGoNext={!insights.isCurrentMonth} />
          )}
          <PeriodPicker period={period} />
          {period.month && (
            <Button asChild variant="outline">
              <a href={`/api/statements/${period.month}`} download>
                <FileDown /> Statement
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <StatTiles
          totals={insights.totals}
          previous={insights.previous}
          against={period.month ? "last month" : `previous ${periodDays(period)} days`}
        />

        <AssistantCard />

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Income vs expenses</CardTitle>
              <p className="text-sm text-muted-foreground">
                12 months to {monthLabel(insights.endMonth)}
              </p>
            </CardHeader>
            <CardContent>
              <TrendChart data={insights.trend} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Where it went</CardTitle>
              <p className="text-sm text-muted-foreground">Spending by category · {label}</p>
            </CardHeader>
            <CardContent>
              <CategoryDonut categories={insights.categories} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily spending</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingHeatmap heatmap={insights.heatmap} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <BudgetsCard
              budgets={insights.budgets}
              month={period.month ? null : insights.endMonth}
            />
            <BalancesCard accounts={accounts} />
          </div>
          <div className="lg:col-span-3">
            <RecentCard recent={recent} />
          </div>
        </div>
      </div>
    </>
  );
};

DashboardPage.getLayout = appLayout;
export default DashboardPage;

/** Budgets are monthly; for a custom range, `month` is the month it ends in. */
function BudgetsCard({ budgets, month }: { budgets: BudgetProgress[]; month: MonthKey | null }) {
  // Most-used first, so budgets that need attention surface.
  const top = [...budgets].sort((a, b) => b.spent / b.amount - a.spent / a.amount).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budgets</CardTitle>
          {month && <p className="mt-1 text-sm text-muted-foreground">{monthLabel(month)}</p>}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={month ? `/budgets?month=${month}` : "/budgets"}>
            {budgets.length ? "All budgets" : "Set up"} <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No budgets yet"
            description="Set monthly limits and get alerts at 80% and 100%."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {top.map((b) => (
              <BudgetBar key={b.budget_id} budget={b} compact />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BalancesCard({ accounts }: { accounts: Account[] }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">Net balance</p>
        <Money
          amount={sumMoney(accounts.map((a) => a.balance))}
          className="text-3xl font-semibold"
        />
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {accounts.map((a) => {
            const { icon: Icon } = ACCOUNT_TYPE_META[a.type];
            return (
              <li key={a.id} className="flex items-center gap-3">
                <span
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${a.color}22`, color: a.color }}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 truncate text-sm">{a.name}</span>
                <Money amount={a.balance} className="text-sm" />
              </li>
            );
          })}
        </ul>
        <Button asChild variant="link" className="mt-3 px-0">
          <Link href="/accounts">
            Manage accounts <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentCard({ recent }: { recent: TransactionRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent transactions</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            View all <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Nothing here yet"
            description="Your latest transactions will show up here."
            action={
              <Button asChild>
                <Link href="/transactions?new=1">Add a transaction</Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <CategoryIcon
                  icon={t.type === "transfer" ? "repeat" : (t.category?.icon ?? "tag")}
                  color={t.type === "transfer" ? "#64748b" : (t.category?.color ?? "#94a3b8")}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.description ||
                      (t.type === "transfer" ? "Transfer" : (t.category?.name ?? "Uncategorised"))}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatShortDate(t.date)} · {t.account?.name}
                  </span>
                </span>
                <Money
                  amount={t.amount}
                  tone={
                    t.type === "income" ? "income" : t.type === "expense" ? "expense" : "neutral"
                  }
                  className="text-sm"
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
