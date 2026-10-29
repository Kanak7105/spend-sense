import { Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/frontend/components/shared/logo";
import { Button } from "@/frontend/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import type { Viewer } from "@/shared/types/viewer";

import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

/** Mobile hamburger: slides in the full navigation from the left. */
export function MobileMenu({ viewer }: { viewer: Viewer }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 gap-0 bg-sidebar p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">All sections of SpendSense</SheetDescription>
        <Logo href="/dashboard" className="px-2" />
        <div className="mt-8 flex-1 overflow-y-auto">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t pt-4">
          <UserMenu viewer={viewer} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
