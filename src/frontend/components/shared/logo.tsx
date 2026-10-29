import Image from "next/image";
import Link from "next/link";

import { cn } from "@/frontend/lib/utils";

// Book marks cropped from public/A · Khata book (primary)@1x.png (162×182, transparent).
const LIGHT_MARK = "/brand/khata-light.png"; // red book: for paper backgrounds
const DARK_MARK = "/brand/khata-dark.png"; // paper book: for the red shell and night pages

function Mark({ src, className }: { src: string; className?: string }) {
  return (
    <Image src={src} alt="" width={32} height={36} className={cn("h-9 w-8", className)} priority />
  );
}

/**
 * SpendSense khata-book mark + Kalam wordmark.
 * `surface="shell"` (red cloth, both themes) always uses the paper book;
 * `surface="page"` uses the red book by day and the paper book by night.
 */
export function Logo({
  href = "/",
  className,
  iconOnly = false,
  surface = "page",
}: {
  href?: string;
  className?: string;
  iconOnly?: boolean;
  surface?: "shell" | "page";
}) {
  return (
    <Link
      href={href}
      aria-label={iconOnly ? "SpendSense" : undefined}
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      {surface === "shell" ? (
        <Mark src={DARK_MARK} />
      ) : (
        <>
          <Mark src={LIGHT_MARK} className="dark:hidden" />
          <Mark src={DARK_MARK} className="hidden dark:block" />
        </>
      )}
      {!iconOnly && <span className="font-display text-xl leading-none font-bold">SpendSense</span>}
    </Link>
  );
}
