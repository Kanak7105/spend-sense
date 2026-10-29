import { CalendarClock, CircleCheck, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
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
import { Progress } from "@/frontend/components/ui/progress";
import { formatMoney, formatShortDate } from "@/frontend/lib/format";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { daysBetween, todayIST } from "@/shared/lib/dates";
import type { SavingsGoal } from "@/shared/schemas/goals";

import { deleteGoal } from "../api";
import { GoalAdjustDialog } from "./goal-adjust-dialog";
import { GoalFormDialog } from "./goal-form-dialog";

/** "₹4,200/month to reach it by 31 Mar 2027", or null when not applicable. */
function pace(goal: SavingsGoal) {
  const remaining = goal.target_amount - goal.saved_amount;
  if (!goal.deadline || remaining <= 0) return null;
  const days = daysBetween(todayIST(), goal.deadline);
  if (days <= 0) return { overdue: true as const, perMonth: remaining };
  const months = Math.max(days / 30.44, 1);
  return { overdue: false as const, perMonth: Math.ceil(remaining / months) };
}

export function GoalCard({ goal }: { goal: SavingsGoal }) {
  const [editing, setEditing] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const refresh = useRefresh();

  const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
  const done = goal.saved_amount >= goal.target_amount;
  const p = pace(goal);

  async function onDelete() {
    const result = await deleteGoal(goal.id);
    if (!result.ok) return void toast.error(result.error);
    toast.success("Goal deleted");
    await refresh();
  }

  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <CategoryIcon icon={goal.icon} color={goal.color} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{goal.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatMoney(goal.saved_amount)} of {formatMoney(goal.target_amount)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${goal.name}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <Progress
            value={pct}
            aria-label={`${Math.round(pct)}% of ${goal.name} saved`}
            className="h-2 [&>[data-slot=progress-indicator]]:bg-(--goal-color)"
            style={{ "--goal-color": goal.color } as React.CSSProperties}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">{Math.round(pct)}%</span>
            {goal.deadline && <span>by {formatShortDate(goal.deadline)}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {done ? (
              <>
                <CircleCheck className="size-3.5 text-primary" /> Goal reached
              </>
            ) : p?.overdue ? (
              <>
                <CalendarClock className="size-3.5 text-warning" />
                Past target date · {formatMoney(p.perMonth)} to go
              </>
            ) : p ? (
              <>
                <CalendarClock className="size-3.5" />
                Save {formatMoney(p.perMonth)}/month to make it
              </>
            ) : (
              `${formatMoney(goal.target_amount - goal.saved_amount)} to go`
            )}
          </p>
          <Button size="sm" variant="outline" onClick={() => setAdjusting(true)}>
            <Plus /> Add money
          </Button>
        </div>
      </CardContent>

      <GoalFormDialog goal={goal} open={editing} onOpenChange={setEditing} />
      <GoalAdjustDialog goal={goal} open={adjusting} onOpenChange={setAdjusting} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${goal.name}”?`}
        description="This removes the goal and its saved total. Your accounts aren't affected."
        onConfirm={onDelete}
      />
    </Card>
  );
}
