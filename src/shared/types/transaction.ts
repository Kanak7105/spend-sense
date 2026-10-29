import type { Tables } from "./database";

type Tx = Tables<"transactions">;

/**
 * A transaction with its category and account(s) embedded — the contract
 * between backend/features/transactions/queries.ts and the frontend list.
 */
export type TransactionRow = Pick<
  Tx,
  | "id"
  | "type"
  | "amount"
  | "date"
  | "description"
  | "notes"
  | "account_id"
  | "to_account_id"
  | "category_id"
  | "created_at"
> & {
  category: Pick<Tables<"categories">, "id" | "name" | "icon" | "color"> | null;
  account: Pick<Tables<"accounts">, "id" | "name" | "color"> | null;
  to_account: Pick<Tables<"accounts">, "id" | "name" | "color"> | null;
};
