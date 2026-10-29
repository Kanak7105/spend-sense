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

/** Tabs in the mobile bar (two each side of the add button); every page is also in the menu. */
export const MOBILE_TABS = ["/dashboard", "/transactions", "/budgets", "/goals"];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
