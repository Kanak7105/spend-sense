import { ChartPie, PiggyBank, ReceiptIndianRupee, Smartphone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/frontend/components/shared/logo";
import { ThemeToggle } from "@/frontend/components/shared/theme-toggle";
import { Button } from "@/frontend/components/ui/button";

// Signed-in visitors are redirected to /dashboard by src/proxy.ts.

const features = [
  {
    icon: ReceiptIndianRupee,
    title: "Every rupee, sorted",
    body: "Log cash, bank, UPI and card spends with categories that fit how you live.",
  },
  {
    icon: ChartPie,
    title: "See where it goes",
    body: "Filter by date, account or category and spot the leaks in seconds.",
  },
  {
    icon: PiggyBank,
    title: "Budgets & goals",
    body: "Set monthly limits and savings targets, and get nudged before you overshoot.",
  },
  {
    icon: Smartphone,
    title: "Phone-first",
    body: "A fast, installable app with dark mode that feels at home on Android.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
          Know where your money goes.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">
          SpendSense is a simple, private expense tracker built for India — accounts, categories,
          budgets and goals in one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Get started — it&apos;s free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I have an account</Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="size-6 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        Built with Next.js & Supabase.
      </footer>
    </div>
  );
}
