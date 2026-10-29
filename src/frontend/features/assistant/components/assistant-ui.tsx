import { History } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { cn } from "@/frontend/lib/utils";
import {
  AI_DAILY_LIMIT,
  PROMPT_GROUPS,
  PROMPT_LABELS,
  type PromptId,
} from "@/shared/schemas/assistant";

import { useAssistant, type AssistantMessage } from "../assistant-context";

/** Pieces shared by the dashboard card and the /assistant page. */

export function RemainingBadge() {
  const { remaining } = useAssistant();
  if (remaining === null) return null;
  return (
    <Badge variant={remaining <= 0 ? "destructive" : "secondary"} className="shrink-0">
      {remaining}/{AI_DAILY_LIMIT} left today
    </Badge>
  );
}

/**
 * Question chips, grouped ("Insights", "Just for fun"). `only` limits which
 * ids show (the dashboard card shows a few). `onPick` replaces asking in place
 * (the card opens the /assistant page instead).
 */
export function PromptChips({
  activeId,
  only,
  onPick,
}: {
  activeId?: string;
  only?: readonly PromptId[];
  onPick?: (id: PromptId) => void;
}) {
  const { remaining, pending, ask } = useAssistant();
  const exhausted = remaining !== null && remaining <= 0;
  const groups = PROMPT_GROUPS.map((g) => ({
    ...g,
    ids: only ? g.ids.filter((id) => only.includes(id)) : g.ids,
  })).filter((g) => g.ids.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.label} role="group" aria-label={group.label}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.ids.map((id) => (
              <Button
                key={id}
                variant={activeId === id ? "secondary" : "outline"}
                size="sm"
                className="h-auto rounded-full py-1.5 whitespace-normal"
                disabled={exhausted || pending !== null}
                onClick={() => (onPick ? onPick(id) : void ask(id))}
              >
                {PROMPT_LABELS[id]}
              </Button>
            ))}
          </div>
        </div>
      ))}
      {exhausted && (
        <p className="text-xs text-muted-foreground">
          You&apos;ve used today&apos;s questions. Resets at midnight.
        </p>
      )}
    </div>
  );
}

export function AnswerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-label="Thinking">
      <Skeleton className="h-3.5 w-11/12 bg-foreground/10" />
      <Skeleton className="h-3.5 w-4/5 bg-foreground/10" />
      <Skeleton className="h-3.5 w-2/3 bg-foreground/10" />
    </div>
  );
}

export function AnswerBody({ message }: { message: AssistantMessage }) {
  return (
    <>
      <div className="text-sm leading-relaxed [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {message.cached && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="size-3.5" /> Saved answer (data unchanged), no question used
        </p>
      )}
    </>
  );
}
