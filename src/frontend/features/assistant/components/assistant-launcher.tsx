import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/frontend/components/ui/button";

/** Floating shortcut to the /assistant page, on every signed-in page except that one. */
export function AssistantLauncher() {
  const { pathname } = useRouter();
  if (pathname === "/assistant") return null;

  return (
    <Button
      asChild
      size="icon-lg"
      className="fixed right-4 bottom-24 z-40 size-12 rounded-full border-2 border-sidebar-primary md:right-8 md:bottom-8"
    >
      <Link href="/assistant" aria-label="Ask SpendSense">
        <Sparkles className="size-5" />
      </Link>
    </Button>
  );
}
