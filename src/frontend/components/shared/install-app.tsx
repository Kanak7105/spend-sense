import { Download } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/button";
import { DropdownMenuItem } from "@/frontend/components/ui/dropdown-menu";
import { promptInstall, registerServiceWorker, useInstallMode } from "@/frontend/lib/pwa";

/** Mounted once in _app: registers the service worker. */
export function PwaSetup() {
  useEffect(registerServiceWorker, []);
  return null;
}

function useInstall() {
  const mode = useInstallMode();

  async function install() {
    if (mode === "ios") {
      toast("Install SpendSense", {
        description: "Tap the Share button in Safari, then “Add to Home Screen”.",
        duration: 8000,
      });
      return;
    }
    if (await promptInstall()) toast.success("SpendSense installed — find it on your home screen.");
  }

  return { mode, install };
}

/** "Install app" button; renders nothing when the app is installed or can't be installed. */
export function InstallAppButton(props: Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const { mode, install } = useInstall();
  if (!mode) return null;
  return (
    <Button {...props} onClick={() => void install()}>
      <Download /> Install app
    </Button>
  );
}

/** Same as InstallAppButton, as a dropdown menu item (user menu). */
export function InstallAppMenuItem() {
  const { mode, install } = useInstall();
  if (!mode) return null;
  return (
    <DropdownMenuItem onSelect={() => void install()}>
      <Download /> Install app
    </DropdownMenuItem>
  );
}
