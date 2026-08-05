import { useSyncExternalStore } from "react";
import { invoicesStore, type Invoice } from "../../stores/invoicesStore";
import type { ReportDef } from "../types";

// Sales Tax Report (FR-12.11) — helps the business file and pay sales tax per
// taxing authority. Source: invoice list, all statuses except Draft (a Draft is
// not a verified invoice) and Void. MVP prototype models the Florida 6.5%
// profile — Florida State Tax 6% + City of Tampa 0.5% — applied to every
// invoice; tax per authority is derived from the invoice total. The
// accounting-method switch has exactly two options (never both): Accrual
// (invoice date — full tax owed once invoiced) and Cash (payment date — tax
// owed in proportion to the amount actually collected).

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PROFILE_NAME = "Florida 6.5%";
const STATE_RATE = 0.06;
const CITY_RATE = 0.005;
const TOTAL_RATE = STATE_RATE + CITY_RATE;

// Derived tax figures for one invoice. Base = total net of tax.
const taxBase = (i: Invoice) => i.total / (1 + TOTAL_RATE);
const stateTax = (i: Invoice) => taxBase(i) * STATE_RATE;
const cityTax = (i: Invoice) => taxBase(i) * CITY_RATE;
const fullTax = (i: Invoice) => stateTax(i) + cityTax(i);
// Fraction of the invoice actually collected (Cash method).
const paidFraction = (i: Invoice) => (i.total > 0 ? Math.min(1, Math.max(0, (i.total - i.balance) / i.total)) : 0);

// The Accrual/Cash switch is a quick filter; the row-level figures always show
// the full (accrual) tax, while the stat tiles honor the selected method via
// the filtered row set — Cash keeps only invoices with money collected and the
// tiles weight them by paid fraction.
let currentMethod: "accrual" | "cash" = "accrual";
const methodTax = (i: Invoice, pick: (i: Invoice) => number) =>
  currentMethod === "cash" ? pick(i) * paidFraction(i) : pick(i);

export const salesTaxReport: ReportDef<Invoice> = {
  id: "sales-tax",
  category: "financial",
  name: "Sales tax report",
  description: "Tax liability per taxing authority — accrual (invoice date) or cash (payment date) basis, from your Invoices list.",
  icon: "account_balance",
  useRows: () => useSyncExternalStore(invoicesStore.subscribe, invoicesStore.getSnapshot),
  rowKey: (i) => i.id,
  dateField: (i) => i.date,
  defaultDatePreset: "this_month",
  searchText: (i) => `${i.number} ${i.clientName} ${PROFILE_NAME}`,
  amountField: (i) => i.total,
  // Drafts carry no confirmed tax liability; Void invoices are final nothing-to-pay.
  baseFilter: (i) => i.status !== "Void" && (i as any).stage !== "Draft",
  quickFilters: [
    {
      key: "method", label: "Method", default: "accrual",
      options: [
        { value: "accrual", label: "Accrual (invoice date)" },
        { value: "cash", label: "Cash (payment date)" },
      ],
      match: (i, v) => {
        currentMethod = v as "accrual" | "cash";
        // Cash basis: only invoices with something collected create liability.
        return v === "cash" ? i.total - i.balance > 0 : true;
      },
    },
    {
      key: "status", label: "Status", default: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Unpaid", label: "Unpaid" },
        { value: "Overdue", label: "Overdue" },
        { value: "Paid", label: "Paid" },
        { value: "Partially Paid", label: "Partially Paid" },
      ],
      match: (i, v) => i.status === v,
    },
  ],
  // First tile = total tax liability, then one tile per individual tax
  // (dynamic per FR-12.11 — the Florida profile yields three tiles).
  statCards: [
    { key: "liability", label: "Total tax liability", icon: "account_balance", accent: "#4A6FA5", bg: "#EBF0F8",
      value: (r) => money(r.reduce((a, i) => a + methodTax(i, fullTax), 0)),
      sublabel: (r) => `${r.length} invoices · ${PROFILE_NAME}` },
    { key: "state", label: "Florida State Tax (6%)", icon: "flag", accent: "#16A34A", bg: "#DCFCE7",
      value: (r) => money(r.reduce((a, i) => a + methodTax(i, stateTax), 0)) },
    { key: "city", label: "City of Tampa (0.5%)", icon: "location_city", accent: "#D97706", bg: "#FEF3C7",
      value: (r) => money(r.reduce((a, i) => a + methodTax(i, cityTax), 0)) },
  ],
  // Invoice-list columns plus the tax columns (no job-number column per FR-12.11).
  columns: [
    { key: "number", label: "Number", render: (i) => <span style={{ fontWeight: 600 }}>{i.number}</span> },
    { key: "client", label: "Client name", render: (i) => i.clientName },
    { key: "date", label: "Date", render: (i) => i.date },
    { key: "status", label: "Status", render: (i) => i.status },
    { key: "profile", label: "Tax profile", render: () => PROFILE_NAME },
    { key: "taxAmount", label: "Tax amount", align: "right", render: (i) => money(fullTax(i)) },
    { key: "stateTax", label: "Florida State Tax", align: "right", render: (i) => money(stateTax(i)) },
    { key: "cityTax", label: "City of Tampa", align: "right", render: (i) => money(cityTax(i)) },
    { key: "total", label: "Invoice total", align: "right", render: (i) => money(i.total) },
  ],
};
