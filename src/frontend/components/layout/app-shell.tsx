import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";

import { BottomNav } from "./bottom-nav";
import { MobileMenu } from "./mobile-menu";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { Viewer } from "@/shared/types/viewer";
import { Logo } from "@/frontend/components/shared/logo";
import { ThemeToggle } from "@/frontend/components/shared/theme-toggle";
import { Button } from "@/frontend/components/ui/button";
import { AssistantProvider } from "@/frontend/features/assistant/assistant-context";
import { AssistantLauncher } from "@/frontend/features/assistant/components/assistant-launcher";
import { cn } from "@/frontend/lib/utils";

const COLLAPSED_KEY = "spendsense:sidebar-collapsed";

// Desktop sidebar collapse state, remembered per browser. `memory` keeps it
// working for this visit when storage is blocked (private mode etc.).
let memory = false;
const listeners = new Set<() => void>();

function readCollapsed() {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? memory : stored === "1";
  } catch {
    return memory;
  }
}

function writeCollapsed(value: boolean) {
  memory = value;
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // Not persisted; `memory` still holds it.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

function useSidebarCollapsed() {
  // Server render is always expanded; the stored value applies after hydration.
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  return [collapsed, () => writeCollapsed(!collapsed)] as const;
}

/**
 * Signed-in chrome. Rendered from _app via getLayout so it stays mounted
 * across page navigations. Route protection lives in src/proxy.ts and in
 * every page's getServerSideProps (withUser).
 */
export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <AssistantProvider>
      <div className="flex min-h-svh">
        <aside
          className={cn(
            "shell sticky top-0 hidden h-svh shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground transition-[width] duration-200 md:flex",
            collapsed ? "w-[4.5rem] px-3" : "w-60",
          )}
        >
          {/* Binding stitch down the spine of the khata. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-3 left-1.5 border-l-2 border-dashed"
          />
          <div
            className={cn(
              "flex items-center gap-2",
              collapsed ? "flex-col" : "justify-between pl-2",
            )}
          >
            <Logo href="/dashboard" iconOnly={collapsed} surface="shell" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="text-muted-foreground"
            >
              <ToggleIcon className="size-4" />
            </Button>
          </div>
          {/* Runs to the shell edge so the active bookmark tab fits without side-scrolling. */}
          <div
            className={cn(
              "mt-8 flex-1 overflow-x-hidden overflow-y-auto",
              collapsed ? "-mr-3 pr-3" : "-mr-4 pr-4",
            )}
          >
            <SidebarNav collapsed={collapsed} />
          </div>
          <div
            className={cn("flex items-center gap-1 border-t pt-4", collapsed && "flex-col-reverse")}
          >
            <div className={cn("min-w-0", !collapsed && "flex-1")}>
              <UserMenu viewer={viewer} compact={collapsed} />
            </div>
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shell sticky top-0 z-30 flex items-center gap-1 border-b-2 border-dashed bg-sidebar px-2 py-2 text-sidebar-foreground md:hidden">
            <MobileMenu viewer={viewer} />
            <Logo href="/dashboard" className="flex-1" surface="shell" />
            <ThemeToggle />
            <UserMenu viewer={viewer} compact />
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10">
            {children}
          </main>
        </div>

        <BottomNav />
        <AssistantLauncher />
      </div>
    </AssistantProvider>
  );
}
