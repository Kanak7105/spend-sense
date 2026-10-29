import { useEffect, useRef } from "react";

import { PROMPT_LABELS } from "@/shared/schemas/assistant";

import { useAssistant } from "../assistant-context";

import { AnswerBody, AnswerSkeleton, PromptChips } from "./assistant-ui";

/** The full conversation for the /assistant page: messages above, question chips below. */
export function AssistantChat() {
  const { messages, pending } = useAssistant();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-64 flex-col gap-4" aria-live="polite">
        {messages.length === 0 && !pending && (
          <p className="m-auto max-w-72 text-center text-sm text-muted-foreground">
            Pick a question below. Answers are based on this month&apos;s data.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="contents">
            <UserBubble text={PROMPT_LABELS[m.promptId]} />
            <div className="max-w-[95%] rounded-2xl rounded-tl-sm bg-muted p-4 sm:max-w-[80%]">
              <AnswerBody message={m} />
            </div>
          </div>
        ))}
        {pending && (
          <>
            <UserBubble text={PROMPT_LABELS[pending]} />
            <AnswerSkeleton className="w-full max-w-[95%] rounded-2xl rounded-tl-sm bg-muted p-4 sm:max-w-[80%]" />
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Sticks above the mobile tab bar so the chips stay reachable in a long conversation. */}
      <div className="sticky bottom-20 max-h-[40svh] overflow-y-auto rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur md:bottom-4">
        <PromptChips />
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
      {text}
    </p>
  );
}
