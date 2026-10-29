import { Ellipsis, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { cn } from "@/frontend/lib/utils";

import { isActive, MOBILE_TABS, NAV_ITEMS, type NavItem } from "./nav-items";

const tabClass =
  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground";

/** Mobile tab bar: 3 tabs, a centre "add transaction" button, and "More". */
export function BottomNav() {
  const { pathname } = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const tabs = NAV_ITEMS.filter((i) => MOBILE_TABS.includes(i.href));
  const more = NAV_ITEMS.filter((i) => !MOBILE_TABS.includes(i.href));
  const moreActive = more.some((i) => isActive(pathname, i.href));

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
        {tab(tabs[0])}
        {tab(tabs[1])}
        <div className="flex flex-1 justify-center">
          <Link
            href="/transactions?new=1"
            aria-label="Add transaction"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background"
          >
            <Plus className="size-6" />
          </Link>
        </div>
        {tab(tabs[2])}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button type="button" className={cn(tabClass, moreActive && "text-primary")}>
              <Ellipsis className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
              <SheetDescription className="sr-only">Other sections of SpendSense</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 px-4">
              {more.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-sm font-medium",
                    isActive(pathname, href) && "border-primary text-primary",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
