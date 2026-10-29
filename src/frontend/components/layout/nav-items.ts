import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Shapes,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/goals", label: "Goals", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Shapes },
];

/** Shown as tabs in the mobile bar; the rest live under "More". */
export const MOBILE_TABS = ["/dashboard", "/transactions", "/budgets"];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
