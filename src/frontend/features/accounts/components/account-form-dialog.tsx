import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { handleActionError } from "@/frontend/lib/form";
import { useRefresh } from "@/frontend/lib/use-refresh";

import { createAccount, updateAccount } from "@/frontend/features/accounts/api";
import { ACCOUNT_TYPE_META } from "@/frontend/features/accounts/meta";
import {
  ACCOUNT_TYPES,
  accountSchema,
  type Account,
  type AccountInput,
} from "@/shared/schemas/accounts";

type Props = {
  account?: Account;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function defaults(account?: Account): AccountInput {
  return {
    name: account?.name ?? "",
    type: account?.type ?? "bank",
    openingBalance: account ? String(account.opening_balance) : "0",
    color: account?.color ?? "#3b82f6",
  };
}

export function AccountFormDialog({ account, trigger, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>
            Balances update automatically as you add transactions.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every open starts from fresh defaults. */}
        <AccountForm account={account} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AccountForm({ account, onDone }: { account?: Account; onDone: () => void }) {
  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaults(account),
  });
  const { errors, isSubmitting } = form.formState;
  const refresh = useRefresh();

  async function onSubmit(values: AccountInput) {
    const result = account ? await updateAccount(account.id, values) : await createAccount(values);
    if (!result.ok) return handleActionError(result, form.setError);
    toast.success(account ? "Account updated" : "Account added");
    onDone();
    await refresh();
  }

  return (
    <>
      <form id="account-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="account-name">Name</FieldLabel>
            <Input
              id="account-name"
              placeholder="e.g. HDFC Savings"
              aria-invalid={!!errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>
          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="account-type">Type</FieldLabel>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="account-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => {
                      const { label, icon: Icon } = ACCOUNT_TYPE_META[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <Icon /> {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.type]} />
          </Field>
          <Field data-invalid={!!errors.openingBalance}>
            <FieldLabel htmlFor="account-opening">Opening balance (₹)</FieldLabel>
            <Input
              id="account-opening"
              inputMode="decimal"
              aria-invalid={!!errors.openingBalance}
              {...form.register("openingBalance")}
            />
            <FieldDescription>
              For a credit card, enter outstanding dues as a negative number.
            </FieldDescription>
            <FieldError errors={[errors.openingBalance]} />
          </Field>
          <Field data-invalid={!!errors.color}>
            <FieldLabel htmlFor="account-color">Colour</FieldLabel>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker id="account-color" value={field.value} onChange={field.onChange} />
              )}
            />
            <FieldError errors={[errors.color]} />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="account-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : account ? "Save changes" : "Add account"}
        </Button>
      </DialogFooter>
    </>
  );
}
