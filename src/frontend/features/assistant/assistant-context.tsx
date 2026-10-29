import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { PromptId } from "@/shared/schemas/assistant";

import { askAssistant, getAssistantUsage } from "./api";

export type AssistantMessage = {
  id: number;
  promptId: PromptId;
  content: string;
  cached: boolean;
};

type AssistantState = {
  /** Questions left today; null until loaded. */
  remaining: number | null;
  pending: PromptId | null;
  messages: AssistantMessage[];
  /** Loads today's remaining count once (the dashboard card). */
  loadUsage: () => void;
  /** Uses a count the server already loaded (the /assistant page). */
  seedRemaining: (remaining: number) => void;
  ask: (promptId: PromptId) => Promise<void>;
};

const AssistantContext = createContext<AssistantState | null>(null);

/**
 * Shared by the /assistant page and the dashboard card so the count and
 * conversation stay in sync. Mounted in the app shell: survives page
 * navigation, cleared on reload.
 */
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const usageRequested = useRef(false);
  const [pending, setPending] = useState<PromptId | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);

  const loadUsage = useCallback(() => {
    if (usageRequested.current) return;
    usageRequested.current = true;
    void getAssistantUsage().then((result) => {
      if (result.ok) setRemaining((current) => current ?? result.data.remaining);
      else usageRequested.current = false;
    });
  }, []);

  const seedRemaining = useCallback((value: number) => {
    usageRequested.current = true;
    setRemaining(value);
  }, []);

  const ask = useCallback(async (promptId: PromptId) => {
    setPending(promptId);
    const result = await askAssistant(promptId);
    setPending(null);

    if (!result.ok) {
      if (result.status === 429) setRemaining(0);
      toast.error(result.error);
      return;
    }
    setRemaining(result.data.remaining);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), promptId, content: result.data.content, cached: result.data.cached },
    ]);
  }, []);

  const value = useMemo(
    () => ({ remaining, pending, messages, loadUsage, seedRemaining, ask }),
    [remaining, pending, messages, loadUsage, seedRemaining, ask],
  );
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside <AssistantProvider>");
  return ctx;
}
