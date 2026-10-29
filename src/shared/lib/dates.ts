// Calendar helpers on plain `YYYY-MM-DD` / `YYYY-MM` strings (no timezone drift).
// The app is India-first: server-side "today" is Asia/Kolkata, matching the
// database's recurring-transaction schedule.

export type MonthKey = `${number}-${string}`;

const istFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in India as YYYY-MM-DD. Safe on the server (which runs in UTC). */
export function todayIST() {
  return istFormatter.format(new Date());
}

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthOf(date: string): MonthKey {
  return date.slice(0, 7) as MonthKey;
}

export function shiftMonth(month: MonthKey, by: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + by;
  const year = Math.floor(total / 12);
  const mon = (total % 12) + 1;
  return `${year}-${String(mon).padStart(2, "0")}` as MonthKey;
}

export function daysInMonth(month: MonthKey) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** First and last day of a month, inclusive. */
export function monthRange(month: MonthKey) {
  return { from: `${month}-01`, to: `${month}-${String(daysInMonth(month)).padStart(2, "0")}` };
}

/** Add days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
