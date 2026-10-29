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
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";
import { formatDay } from "@/frontend/lib/format";
import { sumMoney } from "@/frontend/lib/money";
import { useRefresh } from "@/frontend/lib/use-refresh";

import { deleteTransaction } from "@/frontend/features/transactions/api";
import type { TransactionRow } from "@/shared/types/transaction";
import { TransactionFormDialog } from "./transaction-form-dialog";

type Props = {
  transactions: TransactionRow[];
  accounts: Account[];
  categories: Category[];
};

export function TransactionList({ transactions, accounts, categories }: Props) {
  // Keep the last edited row while the dialog animates closed.
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const refresh = useRefresh();
  const [deleting, setDeleting] = useState<TransactionRow | null>(null);

  const groups = groupByDate(transactions);

  async function onDelete() {
    if (!deleting) return;
    const result = await deleteTransaction(deleting.id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Transaction deleted");
    await refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {groups.map(({ date, items }) => {
          const net = sumMoney(
            items.map((t) =>
              t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0,
            ),
          );
          return (
            <section key={date}>
              <div className="mb-2 flex items-center justify-between px-1 text-sm">
                <h2 className="font-medium text-muted-foreground">{formatDay(date)}</h2>
                {net !== 0 && (
                  <Money
                    amount={net}
                    tone={net > 0 ? "income" : "expense"}
                    className="text-xs font-normal"
                  />
                )}
              </div>
              <ul className="divide-y rounded-xl border bg-card">
                {items.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onEdit={() => {
                      setEditing(t);
                      setEditOpen(true);
                    }}
                    onDelete={() => setDeleting(t)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <TransactionFormDialog
        key={editing?.id}
        transaction={editing ?? undefined}
        accounts={accounts}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this transaction?"
        description="The account balance will be adjusted. This can't be undone."
        onConfirm={onDelete}
      />
    </>
  );
}

function TransactionItem({
  transaction: t,
  onEdit,
  onDelete,
}: {
  transaction: TransactionRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const title =
    t.description || (t.type === "transfer" ? "Transfer" : (t.category?.name ?? "Uncategorised"));

  return (
    <li className="flex items-center gap-3 px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {t.type === "transfer" ? (
          <CategoryIcon icon="repeat" color="#64748b" />
        ) : (
          <CategoryIcon icon={t.category?.icon ?? "tag"} color={t.category?.color ?? "#94a3b8"} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            {t.type === "transfer" ? (
              <>
                {t.account?.name} <ArrowRight className="size-3" /> {t.to_account?.name}
              </>
            ) : (
              <>
                {t.description && t.category ? `${t.category.name} · ` : ""}
                {t.account?.name}
              </>
            )}
          </span>
        </span>
        <Money
          amount={t.amount}
          tone={t.type === "income" ? "income" : t.type === "expense" ? "expense" : "neutral"}
          className="shrink-0"
        />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Transaction actions">
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

function groupByDate(transactions: TransactionRow[]) {
  const groups: { date: string; items: TransactionRow[] }[] = [];
  for (const t of transactions) {
    const last = groups.at(-1);
    if (last?.date === t.date) last.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  }
  return groups;
}
