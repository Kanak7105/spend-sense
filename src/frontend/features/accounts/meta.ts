import { Banknote, CreditCard, Landmark, Smartphone, type LucideIcon } from "lucide-react";

import type { AccountType } from "@/shared/schemas/accounts";

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: LucideIcon }> = {
  cash: { label: "Cash", icon: Banknote },
  bank: { label: "Bank account", icon: Landmark },
  upi: { label: "UPI / Wallet", icon: Smartphone },
  card: { label: "Credit card", icon: CreditCard },
};
