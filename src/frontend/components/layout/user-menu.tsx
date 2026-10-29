import { LogOut } from "lucide-react";
import { useRouter } from "next/router";

import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { signOut } from "@/frontend/features/auth/api";

import type { Viewer } from "@/shared/types/viewer";

export function UserMenu({ viewer, compact = false }: { viewer: Viewer; compact?: boolean }) {
  const { name, email, avatarUrl } = viewer;
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await router.replace("/login");
  }
  const display = name || email || "You";
  const initials = display
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const avatar = (
    <Avatar className="size-8">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
            {avatar}
          </Button>
        ) : (
          <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
            {avatar}
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="w-full truncate text-sm font-medium">{display}</span>
              {name && email && (
                <span className="w-full truncate text-xs text-muted-foreground">{email}</span>
              )}
            </span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
