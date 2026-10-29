// Server-only: monthly statement rendered to PDF with @react-pdf/renderer.
// The built-in Helvetica font has no ₹ glyph, so amounts use "Rs.".
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import type { TransactionRow } from "@/shared/types/transaction";

const number = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const rs = (n: number) => `${n < 0 ? "-" : ""}Rs. ${number.format(Math.abs(n))}`;

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#059669" },
  subtitle: { marginTop: 2, color: "#6b7280" },
  section: { marginTop: 18 },
  heading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  summary: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tileLabel: { color: "#6b7280", marginBottom: 2 },
  tileValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  head: { fontFamily: "Helvetica-Bold", color: "#374151", borderBottomColor: "#9ca3af" },
  colDate: { width: "13%" },
  colDesc: { width: "35%" },
  colCat: { width: "20%" },
  colAcc: { width: "17%" },
  colAmt: { width: "15%", textAlign: "right" },
  income: { color: "#059669" },
  expense: { color: "#dc2626" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
});

export type StatementInput = {
  monthLabel: string;
  name: string | null;
  email: string | null;
  transactions: TransactionRow[];
};

function Statement({ monthLabel, name, email, transactions }: StatementInput) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Math.round(t.amount * 100), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Math.round(t.amount * 100), 0);

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const key = t.category?.name ?? "Uncategorised";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Math.round(t.amount * 100));
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Document title={`SpendSense statement — ${monthLabel}`} author="SpendSense">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>SpendSense</Text>
        <Text style={styles.subtitle}>
          Monthly statement · {monthLabel}
          {name || email ? ` · ${name ?? email}` : ""}
        </Text>

        <View style={[styles.section, styles.summary]}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Income</Text>
            <Text style={[styles.tileValue, styles.income]}>{rs(income / 100)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Expenses</Text>
            <Text style={[styles.tileValue, styles.expense]}>{rs(expense / 100)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Net</Text>
            <Text style={styles.tileValue}>{rs((income - expense) / 100)}</Text>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Spending by category</Text>
            {categories.map(([cat, paise]) => (
              <View key={cat} style={styles.row}>
                <Text style={{ width: "60%" }}>{cat}</Text>
                <Text style={{ width: "20%", textAlign: "right", color: "#6b7280" }}>
                  {expense ? `${Math.round((paise / expense) * 100)}%` : ""}
                </Text>
                <Text style={{ width: "20%", textAlign: "right" }}>{rs(paise / 100)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.heading}>Transactions ({transactions.length})</Text>
          <View style={[styles.row, styles.head]} fixed>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colCat}>Category</Text>
            <Text style={styles.colAcc}>Account</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {transactions.length === 0 && (
            <Text style={{ marginTop: 8, color: "#6b7280" }}>No transactions this month.</Text>
          )}
          {transactions.map((t) => (
            <View key={t.id} style={styles.row} wrap={false}>
              <Text style={styles.colDate}>{t.date}</Text>
              <Text style={styles.colDesc}>{t.description || "—"}</Text>
              <Text style={styles.colCat}>
                {t.type === "transfer" ? "Transfer" : (t.category?.name ?? "Uncategorised")}
              </Text>
              <Text style={styles.colAcc}>
                {t.type === "transfer"
                  ? `${t.account?.name ?? ""} to ${t.to_account?.name ?? ""}`
                  : (t.account?.name ?? "")}
              </Text>
              <Text
                style={[
                  styles.colAmt,
                  t.type === "income" ? styles.income : t.type === "expense" ? styles.expense : {},
                ]}
              >
                {t.type === "expense" ? "-" : t.type === "income" ? "+" : ""}
                {rs(t.amount)}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export function renderStatementPdf(input: StatementInput) {
  return renderToBuffer(<Statement {...input} />);
}
