import { ArrowRight, ReceiptText } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";
import Link from "next/link";

import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { Money } from "@/frontend/components/shared/money";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { ACCOUNT_TYPE_META } from "@/frontend/features/accounts/meta";
import { listAccounts } from "@/backend/features/accounts/queries";
import type { Account } from "@/shared/schemas/accounts";
import { listRecentTransactions } from "@/backend/features/transactions/queries";
import type { TransactionRow } from "@/shared/types/transaction";
import { formatShortDate } from "@/frontend/lib/format";
import { sumMoney } from "@/frontend/lib/money";
import { withUser } from "@/backend/lib/auth";

// Phase 1 overview. Charts, budgets and month totals arrive in Phase 2.
export const getServerSideProps = withUser(async ({ supabase }) => {
  const [accounts, recent] = await Promise.all([
    listAccounts(supabase),
    listRecentTransactions(supabase, 6),
  ]);
  return { accounts: accounts.filter((a) => !a.is_archived), recent };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const DashboardPage: PageWithLayout<Props> = ({ accounts, recent }) => (
  <>
    <PageTitle title="Dashboard" />
    <PageHeader title="Dashboard" description="Your money at a glance." />
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <BalancesCard accounts={accounts} />
      </div>
      <div className="lg:col-span-3">
        <RecentCard recent={recent} />
      </div>
    </div>
  </>
);

DashboardPage.getLayout = appLayout;
export default DashboardPage;

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
