# SpendSense

A personal expense tracker built for India (₹). Track cash, bank, UPI and card accounts, categorise
spending, filter your history, and (in upcoming phases) set budgets, savings goals and get AI
insights.

**Stack:** Next.js 16 (Pages Router) · TypeScript · Supabase (Postgres, Auth, RLS) ·
Tailwind CSS v4 · shadcn/ui · React Hook Form + Zod · Recharts

## Features (Phase 1)

- Email/password and Google sign-in, password reset, protected routes
- Accounts (cash / bank / UPI / card) with balances maintained by the database
- Default categories seeded on signup; create, edit and delete your own (icon + colour)
- Transactions: income, expense and transfers between accounts; filter by date range, type,
  account, category and text search; paginated, grouped by day
- Responsive layout — sidebar on desktop, bottom tab bar with quick-add on mobile — and dark mode

## Getting started

### Prerequisites

- Node.js 20.9+ (developed on Node 24)
- A Supabase project

### 1. Install

```bash
git clone <repo-url> spend-sense
cd spend-sense
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable                               | Where to find it                                                      |
| -------------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_…`)           |
| `NEXT_PUBLIC_SITE_URL`                 | Your app's origin, e.g. `http://localhost:3000` (used for auth links) |

### 3. Database

The schema lives in [`supabase/migrations`](supabase/migrations). Apply it to your project with the
Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates all tables, Row Level Security policies, balance triggers and the signup trigger that
seeds default categories and a Cash account.

### 4. Auth providers

In the Supabase dashboard → **Authentication**:

1. **URL Configuration** — set _Site URL_ to your `NEXT_PUBLIC_SITE_URL` and add
   `http://localhost:3000/api/auth/callback` (plus your production URL's `/api/auth/callback`) to
   _Redirect URLs_.
2. **Sign In / Providers → Email** — enabled by default. Turn "Confirm email" off for faster local
   testing if you like.
3. **Sign In / Providers → Google** — create an OAuth client in Google Cloud Console (type: Web
   application), add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorised redirect
   URI, then paste the client ID and secret into Supabase.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                       |
| `npm run build`     | Production build                                           |
| `npm run lint`      | ESLint                                                     |
| `npm run typecheck` | Generate route types and run `tsc`                         |
| `npm run check`     | Lint + typecheck + build                                   |
| `npm run format`    | Prettier (with Tailwind class sorting)                     |
| `npm run db:types`  | Regenerate `src/shared/types/database.ts` from the project|

## Security model

- Row Level Security on every table — users can only read and write their own rows (group data is
  visible to group members only).
- `user_id` columns default to `auth.uid()` and are never sent by the client.
- Composite foreign keys (`(account_id, user_id) → accounts(id, user_id)`) make it impossible to
  reference another user's account or category, even with a crafted request.
- Account balances are computed by database triggers, so they can't be tampered with from the API.
- All API route input is validated with Zod on the server, and write requests must come from the
  app's own origin (CSRF protection).

## Roadmap

- **Phase 1 — Foundation** ✅ auth, schema + RLS, accounts, categories, transactions, layout
- **Phase 2 — Insights:** dashboard charts, budgets with alerts, recurring transactions, savings
  goals, CSV/PDF export
- **Phase 3 — Smart features:** bank statement import, auto-categorisation rules, receipt OCR,
  split expenses
- **Phase 4 — AI:** natural-language entry, monthly insights, spend projection
- **Phase 5 — PWA & release:** offline support, Play Store (TWA), tests, CI, Sentry
