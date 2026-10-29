import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/frontend/components/ui/button";
import { shiftMonth, type MonthKey } from "@/shared/lib/dates";

export function monthLabel(month: MonthKey, style: "long" | "short" = "long") {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-IN", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ‹ October 2026 › — switches ?month= on the current page. */
export function MonthSwitcher({ month, canGoNext }: { month: MonthKey; canGoNext: boolean }) {
  const { pathname, query } = useRouter();
  const href = (m: MonthKey) => ({ pathname, query: { ...query, month: m } });

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="icon" aria-label="Previous month">
        <Link href={href(shiftMonth(month, -1))} scroll={false}>
          <ChevronLeft />
        </Link>
      </Button>
      <span className="min-w-36 text-center text-sm font-medium">{monthLabel(month)}</span>
      {canGoNext ? (
        <Button asChild variant="outline" size="icon" aria-label="Next month">
          <Link href={href(shiftMonth(month, 1))} scroll={false}>
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" aria-label="Next month" disabled>
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}
