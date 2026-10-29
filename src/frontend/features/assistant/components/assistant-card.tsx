import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { PROMPT_IDS, PROMPT_LABELS, type PromptId } from "@/shared/schemas/assistant";

import { useAssistant } from "../assistant-context";

import { AnswerBody, PromptChips, RemainingBadge } from "./assistant-ui";

/** A short selection for the dashboard; the full list is on the /assistant page. */
const CARD_PROMPTS: PromptId[] = [
  "monthly-summary",
  "compare-last-month",
  "budget-health",
  "roast-me",
  "grade-my-month",
];

/** Dashboard entry point: a chip opens the /assistant page and asks it there. */
export function AssistantCard() {
  const router = useRouter();
  const { loadUsage, messages } = useAssistant();
  const latest = messages.at(-1);

  useEffect(() => loadUsage(), [loadUsage]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Ask SpendSense
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            AI answers from a summary of your data (no raw transactions).
          </p>
        </div>
        <RemainingBadge />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <PromptChips
          only={CARD_PROMPTS}
          onPick={(id) => void router.push({ pathname: "/assistant", query: { ask: id } })}
        />

        {latest && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium">{PROMPT_LABELS[latest.promptId]}</p>
            <AnswerBody message={latest} />
          </div>
        )}

        <Button asChild variant="link" size="sm" className="h-auto self-start px-0">
          <Link href="/assistant">
            {PROMPT_IDS.length - CARD_PROMPTS.length} more questions
            {messages.length > 1 && ` · ${messages.length} answers`} <ArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
