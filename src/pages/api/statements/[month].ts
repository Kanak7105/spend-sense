import { renderStatementPdf } from "@/backend/features/statements/statement-pdf";
import { listAllTransactions } from "@/backend/features/transactions/queries";
import { attachment, downloadRoute } from "@/backend/lib/session-route";
import { isMonthKey, monthRange } from "@/shared/lib/dates";

/** GET /api/statements/2026-10 → PDF statement for that month. */
export default downloadRoute(async ({ req, res, supabase, user }) => {
  const month = req.query.month;
  if (!isMonthKey(month)) {
    res.status(400).end("Month must look like 2026-10.");
    return;
  }

  const { from, to } = monthRange(month);
  const [transactions, { data: profile }] = await Promise.all([
    listAllTransactions(supabase, { from, to }),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const monthLabel = new Date(`${from}T00:00:00Z`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const pdf = await renderStatementPdf({
    monthLabel,
    name: profile?.full_name ?? null,
    email: user.email,
    transactions,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", attachment(`spendsense-statement-${month}.pdf`));
  res.status(200).send(pdf);
});
