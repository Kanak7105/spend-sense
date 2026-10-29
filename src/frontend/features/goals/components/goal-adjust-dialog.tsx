import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { formatMoney } from "@/frontend/lib/format";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { positiveAmount } from "@/shared/lib/validation";
import type { SavingsGoal } from "@/shared/schemas/goals";

import { adjustGoal } from "../api";

type Mode = "add" | "withdraw";

/** Add money to / withdraw money from a goal (atomic on the server). */
export function GoalAdjustDialog({
  goal,
  open,
  onOpenChange,
  initialMode = "add",
}: {
  goal: SavingsGoal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal.name}</DialogTitle>
          <DialogDescription>
            {formatMoney(goal.saved_amount)} saved of {formatMoney(goal.target_amount)}
          </DialogDescription>
        </DialogHeader>
        <AdjustForm goal={goal} initialMode={initialMode} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({
  goal,
  initialMode,
  onDone,
}: {
  goal: SavingsGoal;
  initialMode: Mode;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const refresh = useRefresh();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = positiveAmount.safeParse(amount);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter an amount");
    if (mode === "withdraw" && parsed.data > goal.saved_amount) {
      return setError(`You can withdraw at most ${formatMoney(goal.saved_amount)}`);
    }
    setPending(true);
    const result = await adjustGoal(goal.id, {
      delta: mode === "add" ? parsed.data : -parsed.data,
    });
    setPending(false);
    if (!result.ok) return setError(result.fieldErrors?.delta?.[0] ?? result.error);

    const reached =
      mode === "add" &&
      goal.saved_amount < goal.target_amount &&
      result.data.saved >= goal.target_amount;
    if (reached) toast.success(`🎉 You reached your ${goal.name} goal!`);
    else toast.success(mode === "add" ? "Added to goal" : "Withdrawn from goal");
    onDone();
    await refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="w-full">
          <TabsTrigger value="add">Add money</TabsTrigger>
          <TabsTrigger value="withdraw" disabled={goal.saved_amount <= 0}>
            Withdraw
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="goal-adjust-amount">Amount (₹)</FieldLabel>
        <Input
          id="goal-adjust-amount"
          inputMode="decimal"
          placeholder="0.00"
          autoFocus
          value={amount}
          aria-invalid={!!error}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "add" ? "Add" : "Withdraw"}
        </Button>
      </DialogFooter>
    </form>
  );
}
