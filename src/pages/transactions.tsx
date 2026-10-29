import { ReceiptText, SearchX } from "lucide-react";
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
import { listTransactions } from "@/backend/features/transactions/queries";
import {
  FILTER_KEYS,
  parseTransactionFilters,
  type TransactionFilters as Filters,
} from "@/shared/schemas/transactions";
import { withUser } from "@/backend/lib/auth";

export const getServerSideProps = withUser(async ({ ctx, supabase }) => {
  const filters = parseTransactionFilters(ctx.query);
  const [list, accounts, categories] = await Promise.all([
    listTransactions(supabase, filters),
    listAccounts(supabase),
    listCategories(supabase),
  ]);
  // Props must be JSON-serialisable: drop undefined filter values.
  const definedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  ) as Filters;
  return { ...list, accounts, categories, filters: definedFilters };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const TransactionsPage: PageWithLayout<Props> = ({
  rows,
  total,
  page,
  pageCount,
  accounts,
  categories,
  filters,
}) => {
  const isFiltered = FILTER_KEYS.some((k) => filters[k]);
  const activeParams = Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k]]));

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
