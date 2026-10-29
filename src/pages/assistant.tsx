import type { InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

import { getAssistantRemaining } from "@/backend/features/assistant/queries";
import { withUser } from "@/backend/lib/auth";
import { appLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageHeader } from "@/frontend/components/shared/page-header";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { useAssistant } from "@/frontend/features/assistant/assistant-context";
import { AssistantChat } from "@/frontend/features/assistant/components/assistant-chat";
import { RemainingBadge } from "@/frontend/features/assistant/components/assistant-ui";
import { promptIdSchema } from "@/shared/schemas/assistant";

export const getServerSideProps = withUser(async ({ supabase }) => ({
  remaining: await getAssistantRemaining(supabase),
}));

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const AssistantPage: PageWithLayout<Props> = ({ remaining }) => {
  const router = useRouter();
  const { seedRemaining, ask } = useAssistant();
  const askedFromLink = useRef(false);

  useEffect(() => seedRemaining(remaining), [remaining, seedRemaining]);

  // The dashboard card links here with ?ask=<preset>: ask it once, then drop the
  // param so a reload doesn't spend another question.
  useEffect(() => {
    if (!router.isReady || askedFromLink.current) return;
    const parsed = promptIdSchema.safeParse(router.query.ask);
    if (!parsed.success) return;
    askedFromLink.current = true;
    void router.replace("/assistant", undefined, { shallow: true, scroll: false });
    void ask(parsed.data);
  }, [router, ask]);

  return (
    <>
      <PageTitle title="Ask SpendSense" />
      <PageHeader
        title="Ask SpendSense"
        description="AI answers from a summary of your data (no raw transactions)."
        action={<RemainingBadge />}
      />
      <AssistantChat />
    </>
  );
};

AssistantPage.getLayout = appLayout;
export default AssistantPage;
