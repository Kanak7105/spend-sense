import { useSyncExternalStore } from "react";

/**
 * PWA helpers: service worker registration + the "Install app" prompt.
 *
 * Chrome fires `beforeinstallprompt` once, often before React hydrates, so the listener is
 * attached when this module is first evaluated (it is imported from _app via <PwaSetup>).
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // we show our own button instead of the mini-infobar
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export function registerServiceWorker() {
  // Dev builds change constantly; a caching worker there only gets in the way.
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Not fatal: the app works without it, it just isn't installable/offline-aware.
  });
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export type InstallMode = "prompt" | "ios" | null;

function getInstallMode(): InstallMode {
  if (isStandalone()) return null;
  if (deferredPrompt) return "prompt";
  if (isIOS()) return "ios"; // no prompt API: user must use Share → Add to Home Screen
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** How the app can be installed right now (`null` = already installed or not supported). */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, getInstallMode, () => null);
}

/** Shows the browser's install dialog. Returns true if the user accepted. */
export async function promptInstall() {
  const event = deferredPrompt;
  if (!event) return false;
  deferredPrompt = null; // a prompt can only be used once
  notify();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}
