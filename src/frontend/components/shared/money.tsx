import { formatHeroMoney, formatMoney } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";

type Tone = "income" | "expense" | "neutral";

/** Amount in mono tabular numerals; income/expense get a sign (+/−) and colour. */
export function Money({
  amount,
  tone = "neutral",
  hero = false,
  className,
}: {
  amount: number;
  tone?: Tone;
  /** Big totals: Kalam, ledger-style "₹24,860/-" when there are no paise. */
  hero?: boolean;
  className?: string;
}) {
  const format = hero ? formatHeroMoney : formatMoney;
  const sign = tone === "income" ? "+" : tone === "expense" ? "−" : "";
  return (
    <span
      className={cn(
        hero ? "font-display font-bold" : "font-mono font-medium tabular-nums",
        tone === "income" && "text-income",
        tone === "expense" && "text-expense",
        className,
      )}
    >
      {sign}
      {format(tone === "neutral" ? amount : Math.abs(amount))}
    </span>
  );
}
