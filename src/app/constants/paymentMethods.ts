// Canonical payment-method list — single source of truth so the dropdown
// never drifts across CreateClient / ClientDetail / CreatePayment /
// InvoiceDetail / Payments filter. Confirmed with Marek (walkthrough notes):
// only "Credit card on file" is integrated; the rest are recorded with a
// reference number, no live processing.
export const PAYMENT_METHODS = [
  "Credit card on file",
  "Cash",
  "Check",
  "Bank transfer",
  "Consumer financing",
  "Cash App",
  "Venmo",
  "Zelle",
  "Card reader",
  "Type card manually",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Material icon per method. Falls back to "payments" for any legacy/unknown
// value (e.g. older seed records using "ACH" or "Credit Card").
const ICON_MAP: Record<string, string> = {
  "Credit card on file": "credit_card",
  "Cash": "payments",
  "Check": "receipt_long",
  "Bank transfer": "account_balance",
  "Consumer financing": "request_quote",
  "Cash App": "attach_money",
  "Venmo": "account_balance_wallet",
  "Zelle": "bolt",
  "Card reader": "point_of_sale",
  "Type card manually": "keyboard",
  // legacy aliases
  "Credit Card": "credit_card",
  "Debit Card": "credit_card",
  "Bank Transfer": "account_balance",
  "ACH": "account_balance",
  "Wire Transfer": "account_balance",
  "Card": "credit_card",
  "Other": "more_horiz",
};

export const paymentMethodIcon = (method: string): string =>
  ICON_MAP[method] ?? "payments";
