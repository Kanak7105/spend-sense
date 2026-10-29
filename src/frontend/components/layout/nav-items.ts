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

/** Sidebar sections, in ledger order. */
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Hisaab",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/accounts", label: "Accounts", icon: Wallet },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/budgets", label: "Budgets", icon: Target },
      { href: "/goals", label: "Goals", icon: PiggyBank },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    label: "Setup",
    items: [{ href: "/categories", label: "Categories", icon: Shapes }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Tabs in the mobile bar (two each side of the add button); every page is also in the menu. */
export const MOBILE_TABS = ["/dashboard", "/transactions", "/budgets", "/goals"];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
