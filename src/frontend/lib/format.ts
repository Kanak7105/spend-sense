import { format, isToday, isYesterday, parseISO } from "date-fns";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** ₹1,23,456.00 (Indian digit grouping). */
export function formatMoney(amount: number, opts: { compact?: boolean } = {}) {
  return (opts.compact ? inrCompact : inr).format(amount);
}

/** `date` is a Postgres `date` string (YYYY-MM-DD). */
export function formatDay(date: string) {
  const d = parseISO(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM yyyy");
}

export function formatShortDate(date: string) {
  return format(parseISO(date), "d MMM yyyy");
}

/** Today's date in the user's local timezone as YYYY-MM-DD. Call on the client. */
export function localToday() {
  return format(new Date(), "yyyy-MM-dd");
}
