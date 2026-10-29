// Dashboard periods: a whole calendar month (?month=YYYY-MM) or a custom
// inclusive range (?from=YYYY-MM-DD&to=YYYY-MM-DD). Pure string maths, so the
// same parsing runs on the server and in the picker.
import {
  addDays,
  daysBetween,
  isMonthKey,
  monthOf,
  monthRange,
  shiftMonth,
  type MonthKey,
} from "./dates";

/** `month` is set when the period is exactly one calendar month. */
export type Period = { from: string; to: string; month: MonthKey | null };

export type PeriodQuery = { month?: unknown; from?: unknown; to?: unknown };

function isRealDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return false;
  return addDays(value, 0) === value; // rejects 2026-02-30 and friends
}

export function monthPeriod(month: MonthKey): Period {
  return { ...monthRange(month), month };
}

/**
 * Reads the period from a query string. A valid from/to pair wins over ?month=.
 * Never ends after `today`; falls back to the current month.
 */
export function parsePeriod(query: PeriodQuery, today: string): Period {
  const current = monthOf(today);
  const { from, to } = query;

  if (isRealDate(from) && isRealDate(to)) {
    let [start, end] = from <= to ? [from, to] : [to, from];
    if (end > today) end = today;
    if (start > end) start = end;

    // A range covering exactly one calendar month (or this month so far) is that month.
    const month = monthOf(start);
    const whole = monthRange(month);
    if (start === whole.from && (end === whole.to || (month === current && end === today))) {
      return monthPeriod(month);
    }
    return { from: start, to: end, month: null };
  }

  const month = isMonthKey(query.month) && query.month <= current ? query.month : current;
  return monthPeriod(month);
}

/** Inclusive length in days. */
export function periodDays(period: Period) {
  return daysBetween(period.from, period.to) + 1;
}

/** What the period is compared against: the previous month, or the same number of days just before. */
export function previousPeriod(period: Period): Period {
  if (period.month) return monthPeriod(shiftMonth(period.month, -1));
  return {
    from: addDays(period.from, -periodDays(period)),
    to: addDays(period.from, -1),
    month: null,
  };
}

/** Query-string form of a period (the current month needs no params). */
export function periodQuery(period: Period, today: string): Record<string, string> {
  if (period.month) return period.month === monthOf(today) ? {} : { month: period.month };
  return { from: period.from, to: period.to };
}
