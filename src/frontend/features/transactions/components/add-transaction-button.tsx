import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

import { Button } from "@/frontend/components/ui/button";
import type { Account } from "@/shared/schemas/accounts";
import type { Category } from "@/shared/schemas/categories";

import { TransactionFormDialog } from "./transaction-form-dialog";

/** Also opens when the URL has ?new=1 (the mobile "+" tab links there). */
export function AddTransactionButton({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const requested = router.query.new === "1";
  const [open, setOpen] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && requested) {
      const query = { ...router.query };
      delete query.new;
      void router.replace({ pathname: router.pathname, query }, undefined, {
        shallow: true,
        scroll: false,
      });
    }
  }

  return (
    <TransactionFormDialog
      accounts={accounts}
      categories={categories}
      open={open || requested}
      onOpenChange={onOpenChange}
      trigger={
        <Button disabled={accounts.length === 0}>
          <Plus /> Add transaction
        </Button>
      }
    />
  );
}
