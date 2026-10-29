import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";
import { cn } from "@/frontend/lib/utils";

import { FILTER_KEYS, type TransactionFilters as Filters } from "@/shared/schemas/transactions";

const ALL = "all";
const ymd = (d: Date) => format(d, "yyyy-MM-dd");

const PERIODS: Record<string, { label: string; range: () => [string, string] }> = {
  "this-month": {
    label: "This month",
    range: () => [ymd(startOfMonth(new Date())), ymd(endOfMonth(new Date()))],
  },
  "last-month": {
    label: "Last month",
    range: () => {
      const d = subMonths(new Date(), 1);
      return [ymd(startOfMonth(d)), ymd(endOfMonth(d))];
    },
  },
  "last-30": {
    label: "Last 30 days",
    range: () => [ymd(subDays(new Date(), 29)), ymd(new Date())],
  },
  "this-year": {
    label: "This year",
    range: () => [ymd(startOfYear(new Date())), ymd(endOfYear(new Date()))],
  },
};

export function TransactionFilters({
  filters,
  accounts,
  categories,
}: {
  filters: Filters;
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [query, setQuery] = useState(filters.q ?? "");
  const activeCount = FILTER_KEYS.filter((k) => k !== "q" && filters[k]).length;
  const [expanded, setExpanded] = useState(activeCount > 0);

  function update(changes: Partial<Record<(typeof FILTER_KEYS)[number], string | undefined>>) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(router.query)) {
      if (typeof value === "string" && key !== "page") query[key] = value;
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value && value !== ALL) query[key] = value;
      else delete query[key];
    }
    // Re-runs getServerSideProps with the new filters.
    setPending(true);
    void router
      .replace({ pathname: router.pathname, query }, undefined, { scroll: false })
      .finally(() => setPending(false));
  }

  // Debounce search typing into the URL.
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  });
  useEffect(() => {
    if (query === (filters.q ?? "")) return;
    const t = setTimeout(() => updateRef.current({ q: query.trim() || undefined }), 300);
    return () => clearTimeout(t);
  }, [query, filters.q]);

  const hasDates = Boolean(filters.from || filters.to);
  const categoryOptions = (type: "expense" | "income") => categories.filter((c) => c.type === type);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search descriptions"
            aria-label="Search transactions"
            className="pl-9"
          />
          {pending && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="md:hidden"
        >
          <SlidersHorizontal />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      <div className={cn("flex-wrap items-center gap-2", expanded ? "flex" : "hidden md:flex")}>
        <Select value={filters.type ?? ALL} onValueChange={(v) => update({ type: v })}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.account ?? ALL} onValueChange={(v) => update({ account: v })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Account">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category ?? ALL} onValueChange={(v) => update({ category: v })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            <SelectItem value="none">Uncategorised</SelectItem>
            {(["expense", "income"] as const).map((type) => (
              <SelectGroup key={type}>
                <SelectSeparator />
                <SelectLabel>{type === "expense" ? "Expense" : "Income"}</SelectLabel>
                {categoryOptions(type).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={hasDates ? "custom" : ALL}
          onValueChange={(v) => {
            if (v === ALL) return update({ from: undefined, to: undefined });
            const preset = PERIODS[v];
            if (preset) {
              const [from, to] = preset.range();
              update({ from, to });
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All time</SelectItem>
            {Object.entries(PERIODS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
            {hasDates && <SelectItem value="custom">Custom range</SelectItem>}
          </SelectContent>
        </Select>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="date"
            aria-label="From date"
            value={filters.from ?? ""}
            max={filters.to}
            onChange={(e) => update({ from: e.target.value })}
            className="flex-1 sm:w-38"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="To date"
            value={filters.to ?? ""}
            min={filters.from}
            onChange={(e) => update({ to: e.target.value })}
            className="flex-1 sm:w-38"
          />
        </div>

        {(activeCount > 0 || filters.q) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])));
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
