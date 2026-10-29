import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { localToday } from "@/frontend/lib/format";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";
import {
  FREQUENCIES,
  recurringSchema,
  type RecurringInput,
  type RecurringOutput,
  type RecurringRuleRow,
} from "@/shared/schemas/recurring";
import type { TransactionType } from "@/shared/schemas/transactions";

import { createRecurring, updateRecurring } from "../api";

const FREQUENCY_LABEL = {
  daily: "Day(s)",
  weekly: "Week(s)",
  monthly: "Month(s)",
  yearly: "Year(s)",
};

type Options = { accounts: Account[]; categories: Category[] };

type Props = Options & {
  rule?: RecurringRuleRow;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function RecurringFormDialog({ rule, trigger, open, onOpenChange, ...options }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit recurring transaction" : "Add recurring transaction"}
          </DialogTitle>
          <DialogDescription>
            Rent, salary, subscriptions, SIPs — added automatically on schedule.
          </DialogDescription>
        </DialogHeader>
        <RecurringForm rule={rule} onDone={() => setOpen(false)} {...options} />
      </DialogContent>
    </Dialog>
  );
}

function defaults(accounts: Account[], rule?: RecurringRuleRow): RecurringInput {
  if (rule) {
    return {
      type: rule.type,
      amount: String(rule.amount),
      accountId: rule.account_id,
      toAccountId: rule.to_account_id ?? "",
      categoryId: rule.category_id ?? "",
      description: rule.description ?? "",
      frequency: rule.frequency,
      intervalCount: rule.interval_count,
      startDate: rule.start_date,
      endDate: rule.end_date ?? "",
    };
  }
  return {
    type: "expense",
    amount: "",
    accountId: accounts.find((a) => !a.is_archived)?.id ?? "",
    toAccountId: "",
    categoryId: "",
    description: "",
    frequency: "monthly",
    intervalCount: 1,
    startDate: localToday(),
    endDate: "",
  };
}

function RecurringForm({
  rule,
  accounts,
  categories,
  onDone,
}: Options & { rule?: RecurringRuleRow; onDone: () => void }) {
  const form = useForm<RecurringInput, unknown, RecurringOutput>({
    resolver: zodResolver(recurringSchema),
    defaultValues: defaults(accounts, rule),
  });
  const { errors, isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const refresh = useRefresh();

  const accountOptions = accounts.filter(
    (a) => !a.is_archived || a.id === rule?.account_id || a.id === rule?.to_account_id,
  );

  function changeType(next: TransactionType) {
    form.setValue("type", next);
    form.setValue("categoryId", "");
    form.setValue("toAccountId", "");
    form.clearErrors();
  }

  async function onSubmit(values: RecurringOutput) {
    const result = rule ? await updateRecurring(rule.id, values) : await createRecurring(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(rule ? "Recurring transaction updated" : "Recurring transaction added");
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="recurring-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Tabs value={type} onValueChange={(v) => changeType(v as TransactionType)}>
            <TabsList className="w-full">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="rec-amount">Amount (₹)</FieldLabel>
              <Input
                id="rec-amount"
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                {...form.register("amount")}
              />
              <FieldError errors={[errors.amount]} />
            </Field>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="rec-description">Description</FieldLabel>
              <Input
                id="rec-description"
                placeholder={type === "income" ? "e.g. Salary" : "e.g. Rent"}
                aria-invalid={!!errors.description}
                {...form.register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AccountSelect
              control={form.control}
              name="accountId"
              label={type === "transfer" ? "From account" : "Account"}
              accounts={accountOptions}
              error={errors.accountId?.message}
            />
            {type === "transfer" ? (
              <AccountSelect
                control={form.control}
                name="toAccountId"
                label="To account"
                accounts={accountOptions}
                error={errors.toAccountId?.message}
              />
            ) : (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="rec-category">Category</FieldLabel>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="rec-category" className="w-full">
                        <SelectValue placeholder="Uncategorised" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Uncategorised</SelectItem>
                        {categories
                          .filter((c) => c.type === type)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
          </div>

          <Field data-invalid={!!errors.intervalCount || !!errors.frequency}>
            <FieldLabel htmlFor="rec-interval">Repeats every</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="rec-interval"
                type="number"
                min={1}
                max={365}
                className="w-20"
                aria-invalid={!!errors.intervalCount}
                {...form.register("intervalCount")}
              />
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="flex-1" aria-label="Frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FREQUENCY_LABEL[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <FieldError errors={[errors.intervalCount, errors.frequency]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.startDate}>
              <FieldLabel htmlFor="rec-start">Starts on</FieldLabel>
              <Input
                id="rec-start"
                type="date"
                aria-invalid={!!errors.startDate}
                {...form.register("startDate")}
              />
              <FieldDescription>Past dates won&apos;t be backfilled.</FieldDescription>
              <FieldError errors={[errors.startDate]} />
            </Field>
            <Field data-invalid={!!errors.endDate}>
              <FieldLabel htmlFor="rec-end">Ends on</FieldLabel>
              <Input
                id="rec-end"
                type="date"
                aria-invalid={!!errors.endDate}
                {...form.register("endDate")}
              />
              <FieldDescription>Optional.</FieldDescription>
              <FieldError errors={[errors.endDate]} />
            </Field>
          </div>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="recurring-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : rule ? "Save changes" : "Add recurring"}
        </Button>
      </DialogFooter>
    </>
  );
}

function AccountSelect({
  control,
  name,
  label,
  accounts,
  error,
}: {
  control: Control<RecurringInput, unknown, RecurringOutput>;
  name: "accountId" | "toAccountId";
  label: string;
  accounts: Account[];
  error?: string;
}) {
  const inputId = `rec-${name}`;
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={inputId} className="w-full" aria-invalid={!!error}>
              <SelectValue placeholder="Choose account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
