// Whether the company takes card payments online right now — Settings → Payments
// writes it, the client's pay-link page reads it ("This invoice can't be paid
// online" when Stripe isn't connected or cards are turned off). Browser-local in
// the prototype; in production it is the company's Stripe account state.

export type StripeStatus = "disconnected" | "pending" | "connected";

const KEY = "vision360.onlinePayments.v1";

interface OnlinePayments { stripe: StripeStatus; cards: boolean }

const DEFAULT: OnlinePayments = { stripe: "connected", cards: true };

export const readOnlinePayments = (): OnlinePayments => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

export const writeOnlinePayments = (patch: Partial<OnlinePayments>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readOnlinePayments(), ...patch }));
  } catch {
    /* private mode — the pay page falls back to "online payments on" */
  }
};

export const canPayOnline = () => {
  const s = readOnlinePayments();
  return s.stripe === "connected" && s.cards;
};
