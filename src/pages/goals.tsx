import { PiggyBank, Plus } from "lucide-react";
import type { InferGetServerSidePropsType } from "next";

import { listGoals } from "@/backend/features/goals/queries";
import { withUser } from "@/backend/lib/auth";
import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { EmptyState } from "@/frontend/components/shared/empty-state";
import { Money } from "@/frontend/components/shared/money";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";
import { GoalCard } from "@/frontend/features/goals/components/goal-card";
import { GoalFormDialog } from "@/frontend/features/goals/components/goal-form-dialog";
import { sumMoney } from "@/frontend/lib/money";

export const getServerSideProps = withUser(async ({ supabase }) => ({
  goals: await listGoals(supabase),
}));

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const GoalsPage: PageWithLayout<Props> = ({ goals }) => {
  const addButton = (
    <GoalFormDialog
      trigger={
        <Button>
          <Plus /> New goal
        </Button>
      }
    />
  );

  return (
    <>
      <PageTitle title="Savings goals" />
      <PageHeader
        title="Savings goals"
        description="Put money aside for the things you want."
        action={addButton}
      />
      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No goals yet"
          description="An emergency fund, a trip, a new laptop — set a target and track progress."
          action={addButton}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-sm border border-l-2 border-l-margin-rule bg-card p-5">
            <p className="text-sm text-muted-foreground">Saved towards goals</p>
            <p className="text-2xl font-semibold">
              <Money amount={sumMoney(goals.map((g) => g.saved_amount))} />
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                /{" "}
                <Money
                  amount={sumMoney(goals.map((g) => g.target_amount))}
                  className="font-normal"
                />
              </span>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

GoalsPage.getLayout = appLayout;
export default GoalsPage;
