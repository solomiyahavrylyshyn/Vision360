// The client's saved card (Stripe keeps the card; we keep brand, last 4 and
// expiry to show it). One card per client: saving a new one replaces the old,
// which is detached in Stripe once the new one is saved. Every change lands in
// the client's history.
import { clientsStore, type ClientRecord } from "../stores/clientsStore";

export type SavedCard = NonNullable<ClientRecord["cardOnFile"]>;

/** "Visa •••• 4242" */
export const cardLabel = (c: Pick<SavedCard, "brand" | "last4">) => `${c.brand} •••• ${c.last4}`;

/** Expired after the last day of its MM/YY month. In production Stripe says so
 *  (its card updater can move the expiry on its own); here we read the date. */
export function isCardExpired(exp: string, today = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp.replace(/\s/g, ""));
  if (!m) return false;
  const endOfMonth = new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
  return endOfMonth.getTime() < today.getTime();
}

const log = (client: ClientRecord, text: string) =>
  [...(client.history ?? []), { at: new Date().toISOString(), text }];

/** Save a card for the client — replacing (and so removing) any card already on file. */
export function saveCardOnFile(clientId: string, card: Omit<SavedCard, "savedAt">, savedBy: string) {
  const client = clientsStore.getClient(clientId);
  if (!client) return;
  const next: SavedCard = { ...card, savedAt: new Date().toISOString().slice(0, 10) };
  const old = client.cardOnFile;
  const text = old
    ? `Saved card replaced: ${cardLabel(old)} → ${cardLabel(next)} (by ${savedBy})`
    : `Saved card ${cardLabel(next)} added by ${savedBy}`;
  clientsStore.updateClient(clientId, { cardOnFile: next, history: log(client, text) });
}

/** Remove the client's saved card (detached in Stripe in production). */
export function removeCardOnFile(clientId: string, removedBy: string) {
  const client = clientsStore.getClient(clientId);
  if (!client?.cardOnFile) return;
  clientsStore.updateClient(clientId, {
    cardOnFile: undefined,
    history: log(client, `Saved card ${cardLabel(client.cardOnFile)} removed by ${removedBy}`),
  });
}
