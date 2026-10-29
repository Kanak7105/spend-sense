import { formatMoney } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";

type Tone = "income" | "expense" | "neutral";

/** Amount with tabular numerals; income/expense get a sign and colour. */
export function Money({
  amount,
  tone = "neutral",
  className,
}: {
  amount: number;
  tone?: Tone;
  className?: string;
}) {
  const sign = tone === "income" ? "+" : tone === "expense" ? "−" : "";
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        tone === "income" && "text-income",
        tone === "expense" && "text-expense",
        className,
      )}
    >
      {sign}
      {formatMoney(tone === "neutral" ? amount : Math.abs(amount))}
    </span>
  );
}
