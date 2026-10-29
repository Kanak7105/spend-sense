import { Compass } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/frontend/components/shared/empty-state";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { Button } from "@/frontend/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4">
      <PageTitle title="Page not found" />
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        }
      />
    </main>
  );
}
