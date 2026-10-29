import { Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/components/ui/tooltip";
import { cn } from "@/frontend/lib/utils";

import { isActive, NAV_ITEMS } from "./nav-items";

const itemClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

/**
 * Main navigation, used by the desktop sidebar and the mobile drawer.
 * `collapsed` shows icons only, with the label as a tooltip.
 * `onNavigate` runs after any item is chosen (the mobile drawer closes itself).
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useRouter();

  const content = (text: string, Icon: LucideIcon, iconClass?: string) => (
    <>
      <Icon className={cn("size-4 shrink-0", iconClass)} />
      <span className={cn(collapsed && "sr-only")}>{text}</span>
    </>
  );

  const withTooltip = (text: string, node: React.ReactElement) =>
    collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">{text}</TooltipContent>
      </Tooltip>
    ) : (
      node
    );

  const item = (href: string, label: string, icon: LucideIcon) => {
    const active = isActive(pathname, href);
    return (
      <div key={href}>
        {withTooltip(
          label,
          <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              collapsed && "justify-center px-0",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            {content(
              label,
              icon,
              active || href === "/assistant" ? "text-sidebar-primary" : undefined,
            )}
          </Link>,
        )}
      </div>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon }) => item(href, label, icon))}

      <div className="mt-3 border-t pt-3">{item("/assistant", "Ask SpendSense", Sparkles)}</div>
    </nav>
  );
}
