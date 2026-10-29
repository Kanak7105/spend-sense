import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/frontend/components/shared/confirm-dialog";
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
import type { BudgetProgress } from "@/shared/schemas/budgets";

import { deleteBudget } from "../api";
import { BudgetBar } from "./budget-bar";
import { BudgetFormDialog } from "./budget-form-dialog";

export function BudgetList({ budgets }: { budgets: BudgetProgress[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {budgets.map((b) => (
        <BudgetCard key={b.budget_id} budget={b} />
      ))}
    </div>
  );
}

function BudgetCard({ budget }: { budget: BudgetProgress }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = useRefresh();

  async function onDelete() {
    const result = await deleteBudget(budget.budget_id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Budget removed");
    await refresh();
  }

  return (
    <Card className="py-0">
      <CardContent className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <BudgetBar budget={budget} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${budget.name} budget`}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil /> Edit limit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
      <BudgetFormDialog categories={[]} budget={budget} open={editing} onOpenChange={setEditing} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Remove the ${budget.name} budget?`}
        description="Your transactions stay as they are; you just won't track this limit any more."
        confirmLabel="Remove"
        onConfirm={onDelete}
      />
    </Card>
  );
}
