import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { CategoryIcon } from "@/frontend/components/shared/category-icon";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";
import { budgetSchema, type BudgetInput, type BudgetProgress } from "@/shared/schemas/budgets";
import type { Category } from "@/shared/schemas/categories";

import { createBudget, updateBudget } from "../api";

type Props = {
  /** Expense categories that don't have a budget yet (for creating). */
  categories: Category[];
  budget?: BudgetProgress;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BudgetFormDialog({ categories, budget, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? `Edit ${budget.name} budget` : "Add budget"}</DialogTitle>
          <DialogDescription>
            A monthly limit. You&apos;ll get an alert at 80% and when you go over.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm categories={categories} budget={budget} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function BudgetForm({
  categories,
  budget,
  onDone,
}: {
  categories: Category[];
  budget?: BudgetProgress;
  onDone: () => void;
}) {
  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: budget?.category_id ?? "",
      amount: budget ? String(budget.amount) : "",
    },
  });
  const { errors, isSubmitting } = form.formState;
  const refresh = useRefresh();

  async function onSubmit(values: BudgetInput) {
    const result = budget
      ? await updateBudget(budget.budget_id, { amount: values.amount })
      : await createBudget(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(budget ? "Budget updated" : "Budget added");
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="budget-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {!budget && (
            <Field data-invalid={!!errors.categoryId}>
              <FieldLabel htmlFor="budget-category">Category</FieldLabel>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="budget-category" className="w-full">
                      <SelectValue placeholder="Choose an expense category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.categoryId]} />
            </Field>
          )}
          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="budget-amount">Monthly limit (₹)</FieldLabel>
            <Input
              id="budget-amount"
              inputMode="decimal"
              placeholder="e.g. 5000"
              autoFocus={!!budget}
              aria-invalid={!!errors.amount}
              {...form.register("amount")}
            />
            <FieldError errors={[errors.amount]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="budget-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : budget ? "Save changes" : "Add budget"}
        </Button>
      </DialogFooter>
    </>
  );
}
