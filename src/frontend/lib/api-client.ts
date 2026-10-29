import type { ActionResult } from "@/shared/lib/action-result";

/** Call one of our API routes; always resolves to an ActionResult. */
export async function apiRequest<T = undefined>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<ActionResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json: unknown = await res.json().catch(() => null);
    if (json && typeof json === "object" && "ok" in json) return json as ActionResult<T>;
    return { ok: false, error: "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}
