import { format, parseISO } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/frontend/components/ui/popover";
import { Separator } from "@/frontend/components/ui/separator";
import { localToday } from "@/frontend/lib/format";
import { monthOf, shiftMonth } from "@/shared/lib/dates";
import { monthPeriod, parsePeriod, periodQuery, type Period } from "@/shared/lib/period";

import { monthLabel } from "./month-switcher";

const PERIOD_KEYS = ["month", "from", "to"];

/** "October 2026", "1 Aug – 29 Oct 2026" or "1 Dec 2025 – 29 Oct 2026". */
export function periodLabel(period: Period) {
  if (period.month) return monthLabel(period.month);
  const sameYear = period.from.slice(0, 4) === period.to.slice(0, 4);
  const from = format(parseISO(period.from), sameYear ? "d MMM" : "d MMM yyyy");
  return `${from} – ${format(parseISO(period.to), "d MMM yyyy")}`;
}

function presets(today: string): { label: string; period: Period }[] {
  const month = monthOf(today);
  const year = Number(today.slice(0, 4));
  const range = (from: string, to: string) => parsePeriod({ from, to }, today);
  const lastMonths = (n: number) => range(`${shiftMonth(month, 1 - n)}-01`, today);

  return [
    { label: "This month", period: monthPeriod(month) },
    { label: "Last month", period: monthPeriod(shiftMonth(month, -1)) },
    { label: "Last 3 months", period: lastMonths(3) },
    { label: "Last 6 months", period: lastMonths(6) },
    { label: "Last 12 months", period: lastMonths(12) },
    { label: "This year", period: range(`${year}-01-01`, today) },
    { label: "Last year", period: range(`${year - 1}-01-01`, `${year - 1}-12-31`) },
  ];
}

/** Preset periods plus a custom from–to range; writes ?month= or ?from=&to= on the current page. */
export function PeriodPicker({ period }: { period: Period }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function select(next: Period) {
    const query = Object.fromEntries(
      Object.entries(router.query).filter(([key]) => !PERIOD_KEYS.includes(key)),
    );
    setOpen(false);
    void router.push(
      { pathname: router.pathname, query: { ...query, ...periodQuery(next, localToday()) } },
      undefined,
      { scroll: false },
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarRange />
          {period.month ? "Period" : periodLabel(period)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PeriodOptions period={period} onSelect={select} />
      </PopoverContent>
    </Popover>
  );
}

/** Mounts only while the popover is open, so "today" is the browser's and the inputs start fresh. */
function PeriodOptions({
  period,
  onSelect,
}: {
  period: Period;
  onSelect: (period: Period) => void;
}) {
  const today = localToday();
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to > today ? today : period.to);
  const valid = Boolean(from && to && from <= to);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-1">
        {presets(today).map(({ label, period: preset }) => {
          const active = preset.from === period.from && preset.to === period.to;
          return (
            <Button
              key={label}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              className="justify-start"
              aria-pressed={active}
              onClick={() => onSelect(preset)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <Separator />

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSelect(parsePeriod({ from, to }, today));
        }}
      >
        <p className="text-sm font-medium">Custom range</p>
        <label className="grid grid-cols-[2.5rem_1fr] items-center gap-2 text-sm text-muted-foreground">
          From
          <Input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="grid grid-cols-[2.5rem_1fr] items-center gap-2 text-sm text-muted-foreground">
          To
          <Input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button type="submit" size="sm" disabled={!valid}>
          Apply
        </Button>
      </form>
    </div>
  );
}
