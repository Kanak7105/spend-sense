import { Plus, Wallet } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";

import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { Money } from "@/frontend/components/shared/money";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { AccountCard } from "@/frontend/features/accounts/components/account-card";
import { AccountFormDialog } from "@/frontend/features/accounts/components/account-form-dialog";
import { listAccounts } from "@/backend/features/accounts/queries";
import { sumMoney } from "@/frontend/lib/money";
import { withUser } from "@/backend/lib/auth";

export const getServerSideProps = withUser(async ({ supabase }) => ({
  accounts: await listAccounts(supabase),
}));

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const AccountsPage: PageWithLayout<Props> = ({ accounts }) => {
  const active = accounts.filter((a) => !a.is_archived);
  const archived = accounts.filter((a) => a.is_archived);

  return (
    <>
      <PageTitle title="Accounts" />
      <PageHeader
        title="Accounts"
        description="Cash, bank, UPI and cards — balances update with every transaction."
        action={
          <AccountFormDialog
            trigger={
              <Button>
                <Plus /> Add account
              </Button>
            }
          />
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add the places your money lives — a bank account, UPI wallet or your cash."
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="rounded-sm border border-l-2 border-l-margin-rule bg-card p-5">
            <p className="text-sm text-muted-foreground">Net balance</p>
            <Money amount={sumMoney(active.map((a) => a.balance))} hero className="text-4xl" />
          </div>

          <section className="grid gap-3 sm:grid-cols-2">
            {active.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </section>

          {archived.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Archived</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {archived.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
};

AccountsPage.getLayout = appLayout;
export default AccountsPage;
