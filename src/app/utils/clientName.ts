// One rule for what a client is called (CR "client name", Marek). A client can
// be a person, a company, or both, so only ONE of first name, last name,
// preferred name or company name has to be filled in. Middle initial, title and
// role don't count. Every screen that shows a client takes the name from here.

export interface ClientNameParts {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  company?: string;
}

const t = (s?: string) => (s ?? "").trim();

/** At least one of the four name fields is filled in. */
export const hasClientName = (p: ClientNameParts) =>
  !!(t(p.firstName) || t(p.lastName) || t(p.preferredName) || t(p.company));

/** First + last name → else the preferred name → else the company. */
export function clientDisplayName(p: ClientNameParts): string {
  const person = [t(p.firstName), t(p.lastName)].filter(Boolean).join(" ");
  return person || t(p.preferredName) || t(p.company);
}

/** The company, shown smaller on a second line — only when there is also a
 *  person, so a company-only client doesn't print its name twice. */
export function clientSecondLine(p: ClientNameParts): string {
  const company = t(p.company);
  return company && clientDisplayName(p) !== company ? company : "";
}

/** "Hi John," / "Hi Bobby," — or just "Hello," for a company-only client. */
export function clientGreeting(p: ClientNameParts): string {
  const first = t(p.firstName) || t(p.preferredName);
  return first ? `Hi ${first},` : "Hello,";
}

export function clientInitials(p: ClientNameParts): string {
  const f = t(p.firstName), l = t(p.lastName);
  if (f || l) return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase();
  const words = clientDisplayName(p).split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "C";
}

/** Text that matches a client search — the four name fields plus contacts. */
export const clientSearchText = (p: ClientNameParts & { name?: string; email?: string; phone?: string; mobilePhone?: string }) =>
  [p.name, p.firstName, p.lastName, p.preferredName, p.company, p.email, p.phone, p.mobilePhone].filter(Boolean).join(" ").toLowerCase();

export const CLIENT_NAME_HINT = "Enter at least one: first name, last name, preferred name or company";
export const CLIENT_NAME_ERROR = "Enter at least one of these fields";
