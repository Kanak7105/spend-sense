import { Plus, Repeat } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";

import { listAccounts } from "@/backend/features/accounts/queries";
import { listCategories } from "@/backend/features/categories/queries";
import { catchUpRecurring, listRecurringRules } from "@/backend/features/recurring/queries";
import { withUser } from "@/backend/lib/auth";
import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { RecurringFormDialog } from "@/frontend/features/recurring/components/recurring-form-dialog";
import { RecurringList } from "@/frontend/features/recurring/components/recurring-list";

export const getServerSideProps = withUser(async ({ supabase }) => {
  await catchUpRecurring(supabase);
  const [rules, accounts, categories] = await Promise.all([
    listRecurringRules(supabase),
    listAccounts(supabase),
    listCategories(supabase),
  ]);
  return { rules, accounts, categories };
});

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const RecurringPage: PageWithLayout<Props> = ({ rules, accounts, categories }) => {
  const addButton = (
    <RecurringFormDialog
      accounts={accounts}
      categories={categories}
      trigger={
        <Button disabled={accounts.length === 0}>
          <Plus /> Add recurring
        </Button>
      }
    />
  );

  return (
    <>
      <PageTitle title="Recurring" />
      <PageHeader
        title="Recurring"
        description="Transactions that repeat — added automatically every day at midnight (IST)."
        action={addButton}
      />
      {rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nothing recurring yet"
          description="Add rent, salary, subscriptions or SIPs once and they'll log themselves."
          action={addButton}
        />
      ) : (
        <RecurringList rules={rules} accounts={accounts} categories={categories} />
      )}
    </>
  );
};

RecurringPage.getLayout = appLayout;
export default RecurringPage;
