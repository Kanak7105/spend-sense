import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
import { ColorPicker } from "@/frontend/components/shared/color-picker";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { IconPicker } from "@/frontend/features/categories/components/icon-picker";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { goalSchema, type GoalInput, type SavingsGoal } from "@/shared/schemas/goals";

import { createGoal, updateGoal } from "../api";

type Props = {
  goal?: SavingsGoal;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function GoalFormDialog({ goal, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>An emergency fund, a trip, a new phone…</DialogDescription>
        </DialogHeader>
        <GoalForm goal={goal} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({ goal, onDone }: { goal?: SavingsGoal; onDone: () => void }) {
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name ?? "",
      targetAmount: goal ? String(goal.target_amount) : "",
      deadline: goal?.deadline ?? "",
      icon: goal?.icon ?? "piggy-bank",
      color: goal?.color ?? "#10b981",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const [icon, color] = useWatch({ control: form.control, name: ["icon", "color"] });
  const refresh = useRefresh();

  async function onSubmit(values: GoalInput) {
    const result = goal ? await updateGoal(goal.id, values) : await createGoal(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(goal ? "Goal updated" : "Goal created");
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="goal-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="goal-name">Name</FieldLabel>
            <div className="flex items-center gap-3">
              <CategoryIcon icon={icon} color={color} />
              <Input
                id="goal-name"
                placeholder="e.g. Goa trip"
                aria-invalid={!!errors.name}
                {...form.register("name")}
              />
            </div>
            <FieldError errors={[errors.name]} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.targetAmount}>
              <FieldLabel htmlFor="goal-target">Target (₹)</FieldLabel>
              <Input
                id="goal-target"
                inputMode="decimal"
                placeholder="e.g. 50000"
                aria-invalid={!!errors.targetAmount}
                {...form.register("targetAmount")}
              />
              <FieldError errors={[errors.targetAmount]} />
            </Field>
            <Field data-invalid={!!errors.deadline}>
              <FieldLabel htmlFor="goal-deadline">Target date</FieldLabel>
              <Input
                id="goal-deadline"
                type="date"
                aria-invalid={!!errors.deadline}
                {...form.register("deadline")}
              />
              <FieldDescription>Optional.</FieldDescription>
              <FieldError errors={[errors.deadline]} />
            </Field>
          </div>
          <Field data-invalid={!!errors.icon}>
            <FieldLabel htmlFor="goal-icon">Icon</FieldLabel>
            <Controller
              control={form.control}
              name="icon"
              render={({ field }) => (
                <IconPicker
                  id="goal-icon"
                  value={field.value}
                  onChange={field.onChange}
                  color={color}
                />
              )}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="goal-color">Colour</FieldLabel>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker id="goal-color" value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="goal-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : goal ? "Save changes" : "Create goal"}
        </Button>
      </DialogFooter>
    </>
  );
}
