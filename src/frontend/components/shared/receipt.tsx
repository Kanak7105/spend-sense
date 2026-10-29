import { cn } from "@/frontend/lib/utils";

/**
 * A paper "hisaab" slip: mono type, dashed dividers, centred header. Used for
 * AI answers; reusable for any receipt-style summary.
 */
export function Receipt({
  title,
  children,
  footer,
  className,
}: {
  /** Line under the "हिसाब · Hisaab" header, e.g. the question asked. */
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card px-4 py-3 font-mono text-sm",
        className,
      )}
    >
      <div className="border-b border-dashed border-border pb-2 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          <span lang="hi">हिसाब</span> · Hisaab
        </p>
        {title && <p className="mt-1 text-xs text-foreground">{title}</p>}
      </div>
      <div className="py-3">{children}</div>
      {footer && (
        <div className="border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}
