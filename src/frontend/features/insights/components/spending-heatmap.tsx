import { useEffect, useMemo, useRef, useState } from "react";

import { formatMoney } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";
import { addDays, daysBetween, weekday } from "@/shared/lib/dates";
import type { DashboardData } from "@/shared/types/insights";

// One-hue sequential ramp (CSS tokens --heat-1..5, validated light & dark).
const LEVEL_CLASS = [
  "bg-heat-0",
  "bg-heat-1",
  "bg-heat-2",
  "bg-heat-3",
  "bg-heat-4",
  "bg-heat-5",
] as const;

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

type Cell = { day: string; expense: number; level: number; future: boolean };

/** Quantile thresholds over days with spending, so one big purchase doesn't flatten the rest. */
function thresholds(values: number[]) {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  return [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * (sorted.length - 1))]);
}

function levelFor(value: number, cuts: number[]) {
  if (value <= 0) return 0;
  return 1 + cuts.filter((c) => value > c).length;
}

function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** GitHub-style daily spending calendar: columns are weeks (Sun→Sat), darker = more. */
export function SpendingHeatmap({ heatmap }: { heatmap: DashboardData["heatmap"] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Cell | null>(null);

  const { weeks, monthMarks, busiest, total } = useMemo(() => {
    const byDay = new Map(heatmap.days.map((d) => [d.day, d.expense]));
    const cuts = thresholds(heatmap.days.map((d) => d.expense));
    const span = daysBetween(heatmap.from, heatmap.to) + 1;
    const lastWeekEnd = addDays(heatmap.to, 6 - weekday(heatmap.to));
    const cells: Cell[] = Array.from(
      { length: daysBetween(heatmap.from, lastWeekEnd) + 1 },
      (_, i) => {
        const day = addDays(heatmap.from, i);
        const expense = byDay.get(day) ?? 0;
        return { day, expense, level: levelFor(expense, cuts), future: i >= span };
      },
    );
    const weeks: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const monthMarks = weeks.map((week, i) => {
      const first = week.find((c) => c.day.endsWith("-01")) ?? (i === 0 ? week[0] : undefined);
      return first
        ? new Date(`${first.day}T00:00:00Z`).toLocaleDateString("en-IN", {
            month: "short",
            timeZone: "UTC",
          })
        : "";
    });
    const busiest = heatmap.days.reduce<(typeof heatmap.days)[number] | null>(
      (best, d) => (d.expense > (best?.expense ?? 0) ? d : best),
      null,
    );
    const total = heatmap.days.reduce((s, d) => s + Math.round(d.expense * 100), 0) / 100;
    return { weeks, monthMarks, busiest, total };
  }, [heatmap]);

  // Start scrolled to the most recent weeks on narrow screens.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <figure className="flex flex-col gap-3">
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {hovered ? (
          <>
            <span className="font-medium text-foreground">{formatDay(hovered.day)}</span>
            {" · "}
            {hovered.expense > 0 ? `${formatMoney(hovered.expense)} spent` : "No spending"}
          </>
        ) : busiest ? (
          <>
            Biggest day:{" "}
            <span className="font-medium text-foreground">{formatDay(busiest.day)}</span>
            {" · "}
            {formatMoney(busiest.expense)}
          </>
        ) : (
          "No spending in this period."
        )}
      </p>

      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="inline-flex gap-2">
          <div className="grid grid-rows-[16px_repeat(7,14px)] gap-[3px] pt-px text-[10px] text-muted-foreground">
            <span />
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="leading-[14px]">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]" onMouseLeave={() => setHovered(null)}>
            {weeks.map((week, w) => (
              <div key={week[0].day} className="grid grid-rows-[16px_repeat(7,14px)] gap-[3px]">
                <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                  {monthMarks[w]}
                </span>
                {week.map((cell) => (
                  <span
                    key={cell.day}
                    title={
                      cell.future
                        ? undefined
                        : `${formatDay(cell.day)}: ${cell.expense > 0 ? formatMoney(cell.expense) : "no spending"}`
                    }
                    onMouseEnter={() => !cell.future && setHovered(cell)}
                    className={cn(
                      "size-[14px] rounded-[3px]",
                      cell.future ? "bg-transparent" : LEVEL_CLASS[cell.level],
                      hovered?.day === cell.day && "ring-2 ring-foreground/70",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {formatMoney(total)} spent in the last {weeks.length} weeks
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          Less
          {LEVEL_CLASS.map((cls) => (
            <span key={cls} className={cn("size-3 rounded-[3px]", cls)} />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  );
}
