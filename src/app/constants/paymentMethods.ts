// Canonical payment-method list — single source of truth so the dropdown never
// drifts across CreateClient / ClientDetail / CreatePayment / InvoiceDetail /
// Payments filter. Exactly the set Marek confirmed. Card-type methods
// (Credit Card / Debit Card) are charged live; the rest are recorded with a
// transaction / reference number. (Generic "Card" was dropped — use Credit/Debit.)
export const PAYMENT_METHODS = [
  "Cash",
  "Check",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Consumer Financing",
  "Venmo",
  "Zelle",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Material icon per method. Falls back to "payments" for any legacy/unknown
// value (e.g. older seed records using "ACH" or "Credit Card").
const ICON_MAP: Record<string, string> = {
  "Cash": "payments",
  "Check": "receipt_long",
  "Card": "credit_card",
  "Credit Card": "credit_card",
  "Debit Card": "credit_card",
  "Bank Transfer": "account_balance",
  "Consumer Financing": "request_quote",
  "Venmo": "account_balance_wallet",
  "Zelle": "bolt",
  "Other": "more_horiz",
  // legacy aliases (older seed records / deprecated methods)
  "Credit card on file": "credit_card",
  "Bank transfer": "account_balance",
  "Consumer financing": "request_quote",
  "Cash App": "attach_money",
  "Card reader": "point_of_sale",
  "Type card manually": "keyboard",
  "ACH": "account_balance",
  "Wire Transfer": "account_balance",
};

export const paymentMethodIcon = (method: string): string =>
  ICON_MAP[method] ?? "payments";
