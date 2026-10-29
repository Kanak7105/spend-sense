import { FileDown, ReceiptText, SearchX } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";
import Link from "next/link";

import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { listAccounts } from "@/backend/features/accounts/queries";
import { listCategories } from "@/backend/features/categories/queries";
import { AddTransactionButton } from "@/frontend/features/transactions/components/add-transaction-button";
import { Pagination } from "@/frontend/features/transactions/components/pagination";
import { TransactionFilters } from "@/frontend/features/transactions/components/transaction-filters";
import { TransactionList } from "@/frontend/features/transactions/components/transaction-list";
import { catchUpRecurring } from "@/backend/features/recurring/queries";
import { getTransactionTotals, listTransactions } from "@/backend/features/transactions/queries";
import { Money } from "@/frontend/components/shared/money";
import {
  FILTER_KEYS,
  parseTransactionFilters,
  type TransactionFilters as Filters,
} from "@/shared/schemas/transactions";
import { withUser } from "@/backend/lib/auth";

export const getServerSideProps = withUser(async ({ ctx, supabase }) => {
  await catchUpRecurring(supabase);
  const filters = parseTransactionFilters(ctx.query);
  const [list, totals, accounts, categories] = await Promise.all([
    listTransactions(supabase, filters),
    getTransactionTotals(supabase, filters),
    listAccounts(supabase),
    listCategories(supabase),
  ]);
  // Props must be JSON-serialisable: drop undefined filter values.
  const definedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  ) as Filters;
  return { ...list, totals, accounts, categories, filters: definedFilters };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const TransactionsPage: PageWithLayout<Props> = ({
  rows,
  total,
  page,
  pageCount,
  totals,
  accounts,
  categories,
  filters,
}) => {
  const isFiltered = FILTER_KEYS.some((k) => filters[k]);
  const activeParams = Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k]]));
  const exportQuery = new URLSearchParams(
    Object.entries(activeParams).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();

  return (
    <>
      <PageTitle title="Transactions" />
      <PageHeader
        title="Transactions"
        description="Everything coming in, going out and moving between accounts."
        action={<AddTransactionButton accounts={accounts} categories={categories} />}
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Add an account first"
          description="Transactions belong to an account — cash, bank, UPI or card."
          action={
            <Button asChild>
              <Link href="/accounts">Go to accounts</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <TransactionFilters filters={filters} accounts={accounts} categories={categories} />
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-l-2 border-l-margin-rule bg-card px-4 py-3 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span className="text-muted-foreground">
                  {totals.count} {isFiltered ? "matching" : ""} transaction
                  {totals.count === 1 ? "" : "s"}
                </span>
                <span>
                  In <Money amount={totals.income} tone="income" />
                </span>
                <span>
                  Out <Money amount={totals.expense} tone="expense" />
                </span>
              </div>
              <Button asChild variant="ghost" size="sm">
                <a
                  href={`/api/transactions/export${exportQuery ? `?${exportQuery}` : ""}`}
                  download
                >
                  <FileDown /> Export CSV
                </a>
              </Button>
            </div>
          )}
          {rows.length === 0 ? (
            isFiltered ? (
              <EmptyState
                icon={SearchX}
                title="No matching transactions"
                description="Try a different search or clear some filters."
              />
            ) : (
              <EmptyState
                icon={ReceiptText}
                title="No transactions yet"
                description="Add your first expense or income to start seeing where your money goes."
              />
            )
          ) : (
            <>
              <TransactionList transactions={rows} accounts={accounts} categories={categories} />
              <Pagination page={page} pageCount={pageCount} total={total} params={activeParams} />
            </>
          )}
        </div>
      )}
    </>
  );
};

TransactionsPage.getLayout = appLayout;
export default TransactionsPage;
