import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import type { Viewer } from "@/shared/types/viewer";
import { Logo } from "@/frontend/components/shared/logo";
import { ThemeToggle } from "@/frontend/components/shared/theme-toggle";

/**
 * Signed-in chrome. Rendered from _app via getLayout so it stays mounted
 * across page navigations. Route protection lives in src/proxy.ts and in
 * every page's getServerSideProps (withUser).
 */
export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Logo href="/dashboard" className="px-2" />
        <div className="mt-8 flex-1">
          <SidebarNav />
        </div>
        <div className="flex items-center gap-1 border-t pt-4">
          <div className="min-w-0 flex-1">
            <UserMenu viewer={viewer} />
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur md:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu viewer={viewer} compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
