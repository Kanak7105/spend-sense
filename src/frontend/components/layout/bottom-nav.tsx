import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { cn } from "@/frontend/lib/utils";

import { isActive, MOBILE_TABS, NAV_ITEMS, type NavItem } from "./nav-items";

const tabClass =
  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground";

/** Mobile tab bar: four tabs around a centre "add transaction" button. */
export function BottomNav() {
  const { pathname } = useRouter();
  const tabs = NAV_ITEMS.filter((i) => MOBILE_TABS.includes(i.href));

  const tab = ({ href, label, icon: Icon }: NavItem) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(tabClass, active && "text-primary")}
      >
        <Icon className="size-5" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex items-center">
        {tabs.slice(0, 2).map(tab)}
        <div className="flex flex-1 justify-center">
          <Link
            href="/transactions?new=1"
            aria-label="Add transaction"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background"
          >
            <Plus className="size-6" />
          </Link>
        </div>
        {tabs.slice(2).map(tab)}
      </div>
    </nav>
  );
}
