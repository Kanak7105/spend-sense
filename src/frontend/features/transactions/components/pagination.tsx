import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/frontend/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/transactions?${s}` : "/transactions";
  };

  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} · {total} transactions
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="icon" aria-label="Previous page">
            <Link href={href(page - 1)} scroll={false}>
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" disabled aria-label="Previous page">
            <ChevronLeft />
          </Button>
        )}
        {page < pageCount ? (
          <Button asChild variant="outline" size="icon" aria-label="Next page">
            <Link href={href(page + 1)} scroll={false}>
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon" disabled aria-label="Next page">
            <ChevronRight />
          </Button>
        )}
      </div>
    </nav>
  );
}
