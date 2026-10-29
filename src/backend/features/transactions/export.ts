// Server-only: CSV export of transactions (Papa Parse).
import Papa from "papaparse";

import type { TransactionRow } from "@/shared/types/transaction";

const TYPE_LABEL = { income: "Income", expense: "Expense", transfer: "Transfer" } as const;

/** Signed amount from the user's point of view (transfers are neutral). */
function signed(t: TransactionRow) {
  if (t.type === "income") return t.amount;
  if (t.type === "expense") return -t.amount;
  return 0;
}

export function transactionsToCsv(rows: TransactionRow[]) {
  const csv = Papa.unparse(
    rows.map((t) => ({
      Date: t.date,
      Type: TYPE_LABEL[t.type],
      "Amount (INR)": t.amount.toFixed(2),
      "Net (INR)": signed(t).toFixed(2),
      Account: t.account?.name ?? "",
      "To account": t.to_account?.name ?? "",
      Category: t.type === "transfer" ? "" : (t.category?.name ?? "Uncategorised"),
      Description: t.description ?? "",
      Notes: t.notes ?? "",
    })),
    { header: true, columns: undefined },
  );
  // Byte-order mark so Excel opens UTF-8 (non-ASCII names) correctly.
  return `﻿${csv}`;
}
