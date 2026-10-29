import { Wallet } from "lucide-react";
import Link from "next/link";

import { cn } from "@/frontend/lib/utils";

export function Logo({
  href = "/",
  className,
  iconOnly = false,
}: {
  href?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={iconOnly ? "SpendSense" : undefined}
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="size-4" />
      </span>
      {!iconOnly && <span className="text-lg tracking-tight">SpendSense</span>}
    </Link>
  );
}
