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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Textarea } from "@/frontend/components/ui/textarea";
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";
import { localToday } from "@/frontend/lib/format";
import { notifyBudgetAlert } from "@/frontend/features/budgets/notify";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";

import { createTransaction, updateTransaction } from "@/frontend/features/transactions/api";
import type { TransactionRow } from "@/shared/types/transaction";
import {
  transactionSchema,
  type TransactionInput,
  type TransactionOutput,
  type TransactionType,
} from "@/shared/schemas/transactions";

type Options = { accounts: Account[]; categories: Category[] };

type Props = Options & {
  transaction?: TransactionRow;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function TransactionFormDialog({
  transaction,
  trigger,
  open,
  onOpenChange,
  ...options
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription className="sr-only">
            Amount, account, category and date of the transaction.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm transaction={transaction} onDone={() => setOpen(false)} {...options} />
      </DialogContent>
    </Dialog>
  );
}

function defaults(accounts: Account[], t?: TransactionRow): TransactionInput {
  if (t) {
    return {
      type: t.type,
      amount: String(t.amount),
      accountId: t.account_id,
      toAccountId: t.to_account_id ?? "",
      categoryId: t.category_id ?? "",
      date: t.date,
      description: t.description ?? "",
      notes: t.notes ?? "",
    };
  }
  return {
    type: "expense",
    amount: "",
    accountId: accounts.find((a) => !a.is_archived)?.id ?? "",
    toAccountId: "",
    categoryId: "",
    date: localToday(),
    description: "",
    notes: "",
  };
}

function TransactionForm({
  transaction,
  accounts,
  categories,
  onDone,
}: Options & { transaction?: TransactionRow; onDone: () => void }) {
  const form = useForm<TransactionInput, unknown, TransactionOutput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaults(accounts, transaction),
  });
  const { errors, isSubmitting } = form.formState;
  const refresh = useRefresh();
  const type = useWatch({ control: form.control, name: "type" });

  // Archived accounts stay selectable only if this transaction already uses them.
  const accountOptions = accounts.filter(
    (a) =>
      !a.is_archived || a.id === transaction?.account_id || a.id === transaction?.to_account_id,
  );

  function changeType(next: TransactionType) {
    form.setValue("type", next);
    form.setValue("categoryId", "");
    form.setValue("toAccountId", "");
    form.clearErrors();
  }

  async function onSubmit(values: TransactionOutput) {
    const result = transaction
      ? await updateTransaction(transaction.id, values)
      : await createTransaction(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(transaction ? "Transaction updated" : "Transaction added");
    notifyBudgetAlert(result.data.budgetAlert);
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Tabs value={type} onValueChange={(v) => changeType(v as TransactionType)}>
            <TabsList className="w-full">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>

          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted-foreground">
                ₹
              </span>
              <Input
                id="tx-amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                autoFocus={!transaction}
                className="h-12 pl-8 text-xl font-semibold tabular-nums md:text-xl"
                aria-invalid={!!errors.amount}
                {...form.register("amount")}
              />
            </div>
            <FieldError errors={[errors.amount]} />
          </Field>

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
                <FieldLabel htmlFor="tx-category">Category</FieldLabel>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="tx-category" className="w-full">
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
                <FieldError errors={[errors.categoryId]} />
              </Field>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="tx-description">Description</FieldLabel>
              <Input
                id="tx-description"
                placeholder={type === "income" ? "e.g. October salary" : "e.g. Dinner at Truffles"}
                aria-invalid={!!errors.description}
                {...form.register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="tx-date">Date</FieldLabel>
              <Input
                id="tx-date"
                type="date"
                aria-invalid={!!errors.date}
                {...form.register("date")}
              />
              <FieldError errors={[errors.date]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.notes}>
            <FieldLabel htmlFor="tx-notes">Notes</FieldLabel>
            <Textarea
              id="tx-notes"
              rows={2}
              placeholder="Optional"
              aria-invalid={!!errors.notes}
              {...form.register("notes")}
            />
            <FieldError errors={[errors.notes]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="transaction-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
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
  control: Control<TransactionInput, unknown, TransactionOutput>;
  name: "accountId" | "toAccountId";
  label: string;
  accounts: Account[];
  error?: string;
}) {
  const inputId = `tx-${name}`;
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
