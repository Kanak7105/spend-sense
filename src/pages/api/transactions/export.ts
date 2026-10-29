import { transactionsToCsv } from "@/backend/features/transactions/export";
import { listAllTransactions } from "@/backend/features/transactions/queries";
import { attachment, downloadRoute } from "@/backend/lib/session-route";
import { todayIST } from "@/shared/lib/dates";
import { parseTransactionFilters } from "@/shared/schemas/transactions";

/** GET /api/transactions/export?<same filters as the list> → CSV download. */
export default downloadRoute(async ({ req, res, supabase }) => {
  const filters = parseTransactionFilters(req.query);
  const rows = await listAllTransactions(supabase, filters);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", attachment(`spendsense-transactions-${todayIST()}.csv`));
  res.status(200).send(transactionsToCsv(rows));
});
