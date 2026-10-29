import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/frontend/components/shared/confirm-dialog";
import { Money } from "@/frontend/components/shared/money";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { cn } from "@/frontend/lib/utils";

import { deleteAccount, setAccountArchived } from "@/frontend/features/accounts/api";
import { ACCOUNT_TYPE_META } from "@/frontend/features/accounts/meta";
import type { Account } from "@/shared/schemas/accounts";
import { AccountFormDialog } from "./account-form-dialog";

export function AccountCard({ account }: { account: Account }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = useRefresh();
  const { label, icon: Icon } = ACCOUNT_TYPE_META[account.type];

  async function toggleArchived() {
    const result = await setAccountArchived(account.id, !account.is_archived);
    if (!result.ok) return void toast.error(result.error);
    toast.success(account.is_archived ? "Account restored" : "Account archived");
    await refresh();
  }

  async function onDelete() {
    const result = await deleteAccount(account.id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Account deleted");
    await refresh();
  }

  return (
    <Card className={cn("relative overflow-hidden py-0", account.is_archived && "opacity-60")}>
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: account.color }} />
      <CardContent className="flex items-start gap-3 p-4 pl-5">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${account.color}22`, color: account.color }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{account.name}</p>
            {account.is_archived && <Badge variant="secondary">Archived</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <Money
            amount={account.balance}
            className={cn("mt-2 block text-xl", account.balance < 0 && "text-expense")}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${account.name}`}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void toggleArchived()}>
              {account.is_archived ? <ArchiveRestore /> : <Archive />}
              {account.is_archived ? "Restore" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <AccountFormDialog account={account} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${account.name}”?`}
        description="Accounts with transactions can't be deleted — archive them instead to hide them while keeping history."
        onConfirm={onDelete}
      />
    </Card>
  );
}
