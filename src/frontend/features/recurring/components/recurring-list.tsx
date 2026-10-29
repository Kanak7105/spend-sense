import { ArrowRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { ConfirmDialog } from "@/frontend/components/shared/confirm-dialog";
import { Money } from "@/frontend/components/shared/money";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { Switch } from "@/frontend/components/ui/switch";
import { formatShortDate } from "@/frontend/lib/format";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { cn } from "@/frontend/lib/utils";
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";
import { describeSchedule, type RecurringRuleRow } from "@/shared/schemas/recurring";

import { deleteRecurring, setRecurringActive } from "../api";
import { RecurringFormDialog } from "./recurring-form-dialog";

type Props = { rules: RecurringRuleRow[]; accounts: Account[]; categories: Category[] };

export function RecurringList({ rules, accounts, categories }: Props) {
  const [editing, setEditing] = useState<RecurringRuleRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<RecurringRuleRow | null>(null);
  const refresh = useRefresh();

  async function onDelete() {
    if (!deleting) return;
    const result = await deleteRecurring(deleting.id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Recurring transaction deleted");
    await refresh();
  }

  return (
    <>
      <ul className="divide-y rounded-xl border bg-card">
        {rules.map((rule) => (
          <RecurringRow
            key={rule.id}
            rule={rule}
            onEdit={() => {
              setEditing(rule);
              setEditOpen(true);
            }}
            onDelete={() => setDeleting(rule)}
          />
        ))}
      </ul>
      <RecurringFormDialog
        key={editing?.id}
        rule={editing ?? undefined}
        accounts={accounts}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this recurring transaction?"
        description="Future occurrences stop. Transactions it already created are kept."
        onConfirm={onDelete}
      />
    </>
  );
}

function RecurringRow({
  rule,
  onEdit,
  onDelete,
}: {
  rule: RecurringRuleRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [active, setActive] = useState(rule.is_active);
  const refresh = useRefresh();
  const title =
    rule.description ||
    (rule.type === "transfer" ? "Transfer" : (rule.category?.name ?? "Uncategorised"));

  async function toggle(next: boolean) {
    setActive(next);
    const result = await setRecurringActive(rule.id, next);
    if (!result.ok) {
      setActive(!next);
      return void toast.error(result.error);
    }
    toast.success(next ? "Resumed" : "Paused");
    await refresh();
  }

  return (
    <li className={cn("flex items-center gap-3 px-3 py-3 sm:px-4", !active && "opacity-60")}>
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {rule.type === "transfer" ? (
          <CategoryIcon icon="repeat" color="#64748b" />
        ) : (
          <CategoryIcon
            icon={rule.category?.icon ?? "tag"}
            color={rule.category?.color ?? "#94a3b8"}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          <span className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            {describeSchedule(rule.frequency, rule.interval_count)}
            {" · "}
            {active ? `next ${formatShortDate(rule.next_run_date)}` : "paused"}
            {" · "}
            {rule.type === "transfer" ? (
              <>
                {rule.account?.name} <ArrowRight className="size-3" /> {rule.to_account?.name}
              </>
            ) : (
              rule.account?.name
            )}
          </span>
        </span>
        <Money
          amount={rule.amount}
          tone={rule.type === "income" ? "income" : rule.type === "expense" ? "expense" : "neutral"}
          className="shrink-0"
        />
      </button>
      <Switch
        checked={active}
        onCheckedChange={(v) => void toggle(v)}
        aria-label={active ? "Pause" : "Resume"}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Recurring transaction actions">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
