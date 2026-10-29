import { Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/frontend/components/ui/tooltip";
import { cn } from "@/frontend/lib/utils";

import { isActive, NAV_GROUPS } from "./nav-items";

const itemClass =
  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

// The active page is a paper bookmark tab that runs off the cloth into the page.
// The negative margin cancels the shell's right padding (p-4, or px-3 collapsed).
const activeClass = "rounded-r-none bg-paper text-ink hover:bg-paper hover:text-ink";

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

  const withTooltip = (text: string, node: React.ReactElement) =>
    collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">{text}</TooltipContent>
      </Tooltip>
    ) : (
      node
    );

  const item = (href: string, label: string, Icon: LucideIcon) => {
    const active = isActive(pathname, href);
    return (
      <li key={href}>
        {withTooltip(
          label,
          <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              collapsed && "justify-center px-0",
              active && activeClass,
              active && (collapsed ? "-mr-3" : "-mr-4"),
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>,
        )}
      </li>
    );
  };

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div aria-hidden className="mx-2 mb-2 border-t border-dashed" />
          ) : (
            <p className="mb-1.5 px-3 font-mono text-[11px] tracking-[0.18em] text-sidebar-foreground/80 uppercase">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon }) => item(href, label, icon))}
          </ul>
        </div>
      ))}

      {withTooltip(
        "Ask SpendSense",
        <Link
          href="/assistant"
          onClick={onNavigate}
          aria-current={isActive(pathname, "/assistant") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-sm border border-dashed border-sidebar-primary/70 px-3 py-2 text-sm font-medium text-sidebar-primary transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
            isActive(pathname, "/assistant") && "border-solid bg-sidebar-accent",
          )}
        >
          <Sparkles className="size-4 shrink-0" />
          <span className={cn(collapsed && "sr-only")}>Ask SpendSense</span>
        </Link>,
      )}
    </nav>
  );
}
