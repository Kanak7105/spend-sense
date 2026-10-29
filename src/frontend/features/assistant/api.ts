// Client-side wrappers for the assistant API route.
import { apiRequest } from "@/frontend/lib/api-client";
import type { AssistantAnswer, PromptId } from "@/shared/schemas/assistant";

export const askAssistant = (promptId: PromptId) =>
  apiRequest<AssistantAnswer>("POST", "/api/assistant", { promptId });

export const getAssistantUsage = () => apiRequest<{ remaining: number }>("GET", "/api/assistant");
