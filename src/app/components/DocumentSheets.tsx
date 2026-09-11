// The estimate and invoice documents as the client receives them — preview,
// print and PDF all render these. Layouts follow the Sep 10 sheets reviewed
// with Jean (Estimate layouts/): one option is a portrait card, two to four
// options stand side by side on a landscape sheet, the invoice is a portrait
// statement with the balance called out. Paper size comes from Settings →
// templates (FR-5.15); colours from Company profile → Brand assets.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import "../../styles/document-sheets.css";
import { companyStore } from "../stores/companyStore";
import { BRAND_LOGO_EVENT, getStoredBrandLogo } from "../utils/brandTheme";
import { paperSpec, type PaperSize } from "../stores/documentTemplateStore";

// ─── Page ────────────────────────────────────────────────────────────────────

export type SheetOrientation = "portrait" | "landscape";

const DPI = 96;

/** Pixel size of a sheet at screen resolution, before any scaling. */
export function sheetPixels(paper: PaperSize, orientation: SheetOrientation) {
  const spec = paperSpec(paper);
  const w = Math.round(spec.widthIn * DPI);
  const h = Math.round(spec.heightIn * DPI);
  return orientation === "landscape" ? { width: h, height: w } : { width: w, height: h };
}

interface DocumentPageProps {
  paper: PaperSize;
  orientation?: SheetOrientation;
  /** 1 = actual size. Thumbnails and modals shrink the whole sheet uniformly. */
  scale?: number;
  className?: string;
  children: ReactNode;
}

/**
 * A single sheet of paper. The inner element always has the real page size so
 * the layout breaks exactly where print would; the outer element reserves the
 * scaled footprint so surrounding flex/grid layouts measure it correctly.
 */
export function DocumentPage({ paper, orientation = "portrait", scale = 1, className = "", children }: DocumentPageProps) {
  const { width, height } = sheetPixels(paper, orientation);
  return (
    <div style={{ width: width * scale, height: height * scale, position: "relative", flexShrink: 0 }} className={className}>
      <div
        className={`doc-sheet ${orientation} border border-[#D7DCE3] shadow-2xl`}
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

/** Print rule for the chosen paper — injected next to a preview so Print / PDF match it. */
export function PrintPageRule({ paper, orientation = "portrait" }: { paper: PaperSize; orientation?: SheetOrientation }) {
  return <style>{`@page { size: ${paper} ${orientation}; margin: 0; }`}</style>;
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

export interface DocCompany {
  name: string;
  logo?: string;
  phone: string;
  contactLine: string;
  licenseLine?: string;
}

// Company info lives in Settings → Company info; the prototype persists only the
// name and logo, so the contact lines default to the seed shown on that form.
const DEFAULT_CONTACT = { phone: "(813) 288-7572", contactLine: "omega-home.com · office@omega-home.com", licenseLine: "License LIC-2486-FL" };

/** The company block for the masthead — live name and logo, seeded contact lines. */
export function useDocCompany(overrides?: Partial<DocCompany>): DocCompany {
  const name = useSyncExternalStore(companyStore.subscribe, companyStore.getCompanyName);
  const [logo, setLogo] = useState(() => getStoredBrandLogo());
  useEffect(() => {
    const onChange = (e: Event) => setLogo((e as CustomEvent<string>).detail || "");
    window.addEventListener(BRAND_LOGO_EVENT, onChange);
    return () => window.removeEventListener(BRAND_LOGO_EVENT, onChange);
  }, []);
  return { name, logo: logo || undefined, ...DEFAULT_CONTACT, ...overrides };
}

export const money = (n: number, cents = true) =>
  (n < 0 ? "− " : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

function SheetHeader({ kind, number, meta, company }: { kind: "Estimate" | "Invoice"; number: string; meta: string[]; company: DocCompany }) {
  return (
    <div className="hdr">
      <div>
        {company.logo ? <img src={company.logo} alt={company.name} /> : <div className="wordmark">{company.name}</div>}
      </div>
      <div className="mid">
        <div className="phone">{company.phone}</div>
        <div>{company.contactLine}</div>
        {company.licenseLine && <div className="lic">{company.licenseLine}</div>}
      </div>
      <div className="right">
        <div className="label">{kind}</div>
        <div className="num">{number}</div>
        {meta.map((m) => <div key={m} className="dt">{m}</div>)}
      </div>
    </div>
  );
}

export interface DocCustomer {
  name: string;
  address: string;
  /** Equipment on file, e.g. "Goodman 3 Ton, installed by us 2018". */
  system?: string;
  technician?: string;
}

function CustomerStrip({ customer }: { customer: DocCustomer }) {
  return (
    <div className="info" style={{ gridTemplateColumns: "1fr" }}>
      <div className="row">
        <span className="k">Customer</span><span className="v">{customer.name}</span> · {customer.address}
        {customer.system && <> &nbsp;·&nbsp; <span className="k">System</span>{customer.system}</>}
        {customer.technician && <> &nbsp;·&nbsp; <span className="k">Technician</span>{customer.technician}</>}
      </div>
    </div>
  );
}

export interface DocLine {
  name: string;
  description?: string;
  qty: string | number;
  unitPrice: number | null;
  tax: number | null;
  amount: number | null;
  /** "included" rows — permits, disposal, registration — print muted with dashes. */
  included?: boolean;
}

function LinesTable({ lines, amountLabel, firstColWidth = "50%" }: { lines: DocLine[]; amountLabel: string; firstColWidth?: string }) {
  const dash = "—";
  return (
    <table className="lines">
      <thead>
        <tr>
          <th style={{ width: firstColWidth }}>Item</th>
          <th className="r">Qty</th><th className="r">Unit price</th><th className="r">Tax</th><th className="r">{amountLabel}</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l, i) => (
          <tr key={`${l.name}-${i}`} className={l.included ? "inc" : undefined}>
            <td><div className="n">{l.name}</div>{l.description && <div className="dd">{l.description}</div>}</td>
            <td className="r">{l.included ? dash : l.qty}</td>
            <td className="r">{l.included || l.unitPrice === null ? dash : money(l.unitPrice)}</td>
            <td className="r">{l.included || l.tax === null || l.tax === 0 ? dash : money(l.tax)}</td>
            <td className="r">{l.included ? "included" : l.amount === null ? dash : money(l.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Foot({ left, right }: { left: string; right: string }) {
  return <div className="foot"><span>{left}</span><span>{right}</span></div>;
}

// ─── Estimate — one option (portrait card) ───────────────────────────────────

export interface EstimateSingleData {
  number: string;
  issued: string;
  validUntil: string;
  customer: DocCustomer;
  headline: {
    price: number;
    /** List price before plan savings — printed struck through. */
    wasPrice?: number;
    description: string;
    warranty?: string;
  };
  /** "What we will do" — the scope in plain words. */
  scope?: string;
  lines: DocLine[];
  total: number;
  /** e.g. "$89 per month through Ally, 7.99% APR, 144 months, subject to approval". */
  financing?: string;
  notes?: ReactNode[];
  preparedBy: string;
  pageCount?: number;
}

export function EstimateSingleSheet({ data, company, paper }: { data: EstimateSingleData; company: DocCompany; paper: PaperSize }) {
  return (
    <DocumentPage paper={paper} orientation="portrait">
      <SheetHeader kind="Estimate" number={data.number} meta={[`Issued ${data.issued}`, `Valid until ${data.validUntil}`]} company={company} />
      <CustomerStrip customer={data.customer} />
      <div className="card">
        <div className="top">
          <div className="pr">
            <div className="label">Your estimate</div>
            <div className="price">{money(data.headline.price, false)}{data.headline.wasPrice !== undefined && <span className="was">{money(data.headline.wasPrice, false)}</span>}</div>
            <div className="desc">{data.headline.description}</div>
            {data.headline.warranty && <div className="desc" style={{ marginTop: 6 }}><b>Warranty</b> {data.headline.warranty}</div>}
          </div>
          <div className="why">
            <div className="label">What we will do</div>
            <div className="d">{data.scope || "Scope as listed below."}</div>
          </div>
        </div>
        <LinesTable lines={data.lines} amountLabel="Amount" />
        <div className="band">
          <div>
            <div className="bt">Your price</div>
            <div className="bs">Tax included{data.financing && <> · or <b>{data.financing}</b></>}</div>
          </div>
          <div className="bv">{money(data.total)}</div>
        </div>
        <div className="sign wide">
          <div><div className="line" /><div className="cap">Customer signature · sign to accept</div></div>
          <div><div className="line" /><div className="cap">Date</div></div>
        </div>
      </div>
      {data.notes && data.notes.length > 0 && (
        <div className="notes">{data.notes.map((n, i) => <p key={i} className={i === 0 ? undefined : "fine"}>{n}</p>)}</div>
      )}
      <Foot left={`Estimate ${data.number} · prepared by ${data.preparedBy} · ${data.issued}`} right={`Page 1 of ${data.pageCount ?? 2}`} />
    </DocumentPage>
  );
}

// ─── Estimate — two to four options (landscape grid) ─────────────────────────

export interface EstimateOptionColumn {
  label: string;
  price: number;
  wasPrice?: number;
  /** Tax already inside the price — printed as "includes $X tax". */
  tax?: number;
  description: string;
  items: { name: string; detail?: string }[];
  monthly?: string;
  warranty?: { big: string; small: string };
}

export interface EstimateOptionsData {
  number: string;
  issued: string;
  validUntil: string;
  customer: DocCustomer;
  options: EstimateOptionColumn[];
  fine?: ReactNode;
  preparedBy: string;
  pageCount?: number;
}

export function EstimateOptionsSheet({ data, company, paper }: { data: EstimateOptionsData; company: DocCompany; paper: PaperSize }) {
  const showMonthly = data.options.some((o) => o.monthly);
  const showWarranty = data.options.some((o) => o.warranty);
  return (
    <DocumentPage paper={paper} orientation="landscape">
      <SheetHeader kind="Estimate" number={data.number} meta={[`Issued ${data.issued}`, `Valid until ${data.validUntil}`]} company={company} />
      <CustomerStrip customer={data.customer} />
      <table className="opts">
        <tbody>
          <tr>
            {data.options.map((o) => (
              <td key={o.label}>
                <div className="ohead">
                  <div className="label">{o.label}</div>
                  <div className="price">{money(o.price, false)}{o.wasPrice !== undefined && <span className="was">{money(o.wasPrice, false)}</span>}</div>
                  <div className="desc">{o.description}</div>
                  {o.tax !== undefined && o.tax > 0 && <div className="tax">includes {money(o.tax)} tax</div>}
                </div>
                <div className="items">
                  <ul>{o.items.map((it, i) => <li key={`${it.name}-${i}`}>{it.name}{it.detail && <span className="d">{it.detail}</span>}</li>)}</ul>
                </div>
                <div className="sign"><div className="line" /><div className="cap">Sign to accept</div></div>
                {showMonthly && <div className="monthly">{o.monthly ? <><b>{o.monthly}</b>per month</> : <span>&nbsp;</span>}</div>}
                {showWarranty && (
                  <div className="warr">
                    <div className="l">Warranty</div>
                    <div className="big">{o.warranty?.big ?? "—"}</div>
                    <div className="sm">{o.warranty?.small ?? ""}</div>
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="notes">
        <p className="fine">
          {data.fine ?? <>Terms on page 2. <b>Sign the column you choose.</b> All {data.options.length} options were offered to you.</>}
        </p>
      </div>
      <Foot left={`Estimate ${data.number} · prepared by ${data.preparedBy} · ${data.issued}`} right={`Page 1 of ${data.pageCount ?? 2}`} />
    </DocumentPage>
  );
}

// ─── Estimate — page 2: warranty, payment, terms, confirmation ───────────────

export interface EstimateTermsData {
  number: string;
  customerLine: string;
  optionCount: number;
  /** Company terms from Settings; each block prints as heading + body. Falls back to the standard clauses. */
  termsBlocks?: { heading: string; body?: string }[];
  /** Optional extra sections before the terms (the sample shows warranty and payment). */
  sections?: ReactNode;
  preparedBy: string;
  issued: string;
  pageCount?: number;
}

export function EstimateTermsPage({ data, company, paper }: { data: EstimateTermsData; company: DocCompany; paper: PaperSize }) {
  const multi = data.optionCount > 1;
  const confirm = multi
    ? `I confirm all ${data.optionCount} options were explained to me, and I have signed the one I choose on page 1.`
    : "I accept the estimate on page 1 and have signed it.";
  return (
    <DocumentPage paper={paper} orientation="portrait">
      <div className="p2hdr"><b>{company.name} · Estimate {data.number}</b><span className="muted">{data.customerLine}</span></div>
      {data.sections}
      <div className="sec terms" style={data.sections ? undefined : { borderTop: "none" }}>
        <h3>Terms and conditions</h3>
        {data.termsBlocks && data.termsBlocks.length > 0 ? (
          data.termsBlocks.map((b, i) => <p key={i}>{b.heading && <b>{b.heading} </b>}{b.body}</p>)
        ) : (
          <>
            <p><b>This estimate is valid until the date on page 1.</b> After that, prices may move with manufacturer pricing. Permits, where needed, are pulled by us and included in the price.</p>
            <p>Tax is shown per line; lines without a tax amount are not taxable. If opening the system reveals something we could not see, <b>we stop and show you the cost before continuing. Nothing is added to your price without your approval.</b></p>
            {multi
              ? <p><b>All {data.optionCount} options on page 1 were presented to you.</b> Signing one column does not oblige us to hold the others at those prices once this estimate expires.</p>
              : <p><b>Your signature on page 1 accepts this estimate as written.</b> If you would like a different scope or a second option, ask your technician — we will issue a new estimate rather than change this one.</p>}
          </>
        )}
      </div>
      <div className="confirm">
        <div className="t">{confirm}</div>
        <div className="siglines">
          <div><div className="sl" /><div className="sc">Customer signature</div></div>
          <div><div className="sl" /><div className="sc">Date</div></div>
          <div><div className="sl">{data.preparedBy}</div><div className="sc">{company.name} representative</div></div>
        </div>
      </div>
      <Foot left={`Estimate ${data.number} · prepared by ${data.preparedBy} · ${data.issued} · kept on file as the record of what was offered`} right={`Page 2 of ${data.pageCount ?? 2}`} />
    </DocumentPage>
  );
}

// ─── Invoice (portrait statement) ────────────────────────────────────────────

export interface InvoiceSheetData {
  number: string;
  issued: string;
  billTo: { name: string; address: string; email?: string; phone?: string };
  job?: { title: string; line: string; sub?: string };
  fromEstimate?: { title: string; line: string; sub?: string };
  lines: DocLine[];
  total: number;
  /** Deposits and payments already received, each with how it was paid. */
  payments: { label: string; amount: number }[];
  balance: number;
  dueLine: string;
  payNote?: string;
  warranty?: ReactNode;
  notes?: ReactNode;
  terms?: ReactNode;
  createdBy: string;
}

export function InvoiceSheet({ data, company, paper }: { data: InvoiceSheetData; company: DocCompany; paper: PaperSize }) {
  const refs = [data.job && `job ${data.job.title.split(" · ")[0]}`, data.fromEstimate && `estimate ${data.fromEstimate.title.split(" · ")[0]}`].filter(Boolean).join(" · ");
  return (
    <DocumentPage paper={paper} orientation="portrait">
      <SheetHeader kind="Invoice" number={data.number} meta={[`Issued ${data.issued}`]} company={company} />
      <div className="info" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <div className="label">Bill to</div>
          <div className="v">{data.billTo.name}</div>
          <div className="s">{data.billTo.address}</div>
          {data.billTo.email && <div className="s muted">{data.billTo.email}</div>}
          {data.billTo.phone && <div className="s muted">{data.billTo.phone}</div>}
        </div>
        {data.job && (
          <div>
            <div className="label">Job</div>
            <div className="v">{data.job.title}</div>
            <div className="s">{data.job.line}</div>
            {data.job.sub && <div className="s muted">{data.job.sub}</div>}
          </div>
        )}
        {data.fromEstimate && (
          <div>
            <div className="label">From estimate</div>
            <div className="v">{data.fromEstimate.title}</div>
            <div className="s">{data.fromEstimate.line}</div>
            {data.fromEstimate.sub && <div className="s muted">{data.fromEstimate.sub}</div>}
          </div>
        )}
      </div>
      <LinesTable lines={data.lines} amountLabel="Total" firstColWidth="52%" />
      <div className="sums full">
        <div className="tr total"><span>Total</span><span>{money(data.total)}</span></div>
        {data.payments.map((p, i) => <div key={i} className="tr muted"><span>{p.label}</span><span>{money(-p.amount)}</span></div>)}
        <div className="tr due" style={{ marginTop: 10 }}>
          <span>Balance due<span className="sm">{data.dueLine}</span></span>
          <span>{money(data.balance)}</span>
        </div>
      </div>
      {data.payNote && <p className="muted" style={{ margin: "16px 0 0", fontSize: "10.5px", lineHeight: 1.45 }}>{data.payNote}</p>}
      {(data.warranty || data.notes) && (
        <div className="sec two" style={{ marginTop: 26, paddingTop: 16 }}>
          {data.warranty && <div><h3>Warranty</h3>{data.warranty}</div>}
          {data.notes && <div><h3>Notes</h3>{data.notes}</div>}
        </div>
      )}
      {data.terms && <div className="sec" style={{ marginTop: 22, paddingTop: 16 }}><h3>Terms</h3>{data.terms}</div>}
      <Foot left={`Invoice ${data.number} · created ${data.issued} by ${data.createdBy}${refs ? ` · ${refs}` : ""}`} right="Page 1 of 1" />
    </DocumentPage>
  );
}

// ─── Sample documents — the Sep 10 sheets, used by the Settings previews ─────

const SAMPLE_CUSTOMER: DocCustomer = { name: "Maria Sanchez", address: "12 Oak St, Tampa FL 33612", system: "Goodman 3 Ton, installed by us 2018", technician: "Gary W." };

const Star = () => (
  <svg className="star" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" /></svg>
);

export const SAMPLE_ESTIMATE_SINGLE: EstimateSingleData = {
  number: "10247-E04", issued: "24 Aug 2026", validUntil: "23 Sep 2026",
  customer: SAMPLE_CUSTOMER,
  headline: { price: 3180, wasPrice: 3741, description: "Repair only · tax included", warranty: "1 year parts & labor" },
  scope: "Replace the failed capacitor and the corroded evaporator coil, recharge the system to factory specification and test it under load. This returns the existing Goodman 3 Ton to full cooling; it does not address the duct loss noted today. One visit of 4–5 hours; the coil is on order, 2–3 business days.",
  lines: [
    { name: "Compressor capacitor", description: "45/5 µF, OEM part", qty: 1, unitPrice: 340, tax: 23.8, amount: 363.8 },
    { name: "Evaporator coil", description: "Goodman, matched to the 3 Ton condenser; includes brazing and nitrogen test", qty: 1, unitPrice: 2150, tax: 150.5, amount: 2300.5 },
    { name: "R410A recharge", description: "Refrigerant to factory charge", qty: "8 lb", unitPrice: 45, tax: 25.2, amount: 385.2 },
    { name: "Test and certify", description: "Start-up, pressures and temperatures, written readings left with you", qty: 1, unitPrice: 691.5, tax: null, amount: 691.5 },
    { name: "Home Protection Plan member savings", description: "Your plan discount on this repair", qty: 1, unitPrice: -561, tax: null, amount: -561 },
    { name: "Permits, disposal and warranty registration", description: "Pulled by us where required; old parts removed; warranty registered with Goodman for you", qty: "", unitPrice: null, tax: null, amount: null, included: true },
  ],
  total: 3180,
  financing: "$89 per month through Ally, 7.99% APR, 144 months, subject to approval",
  notes: [
    <><Star />Your <b>Home Protection Plan</b> savings are shown as a line in the table; the list price is shown struck through above. Tax is shown per line; lines without a tax amount are not taxable.</>,
    <>Monthly figure through Ally at 7.99% APR over 144 months, subject to approval. Terms on page 2. <b>Sign to accept.</b> If you would rather see replacement options, ask Gary — we prepare a comparison estimate on the spot.</>,
  ],
  preparedBy: "Gary W.",
};

export const SAMPLE_ESTIMATE_OPTIONS: EstimateOptionsData = {
  number: "10247-E03", issued: "24 Aug 2026", validUntil: "23 Sep 2026",
  customer: SAMPLE_CUSTOMER,
  options: [
    { label: "Option I", price: 27840, wasPrice: 32753, tax: 1412, description: "Full replacement + ductwork", monthly: "$264", warranty: { big: "2 years labor", small: "10 years parts" },
      items: [{ name: "3 Ton condenser + air handler", detail: "14.3 SEER2" }, { name: "Duct replacement", detail: "180 ft, supply and return" }, { name: "Attic insulation to R38", detail: "1,480 sf" }, { name: "Biologic 3 air cleaner" }, { name: "Line set, pad, disconnect" }, { name: "Crane set" }, { name: "Permits and disposal" }, { name: "Warranty registration" }] },
    { label: "Option II", price: 22995, wasPrice: 26994, tax: 1166, description: "Full replacement, higher efficiency", monthly: "$218", warranty: { big: "1 year labor", small: "10 years parts" },
      items: [{ name: "3 Ton condenser + air handler", detail: "15.3 SEER2 — higher efficiency" }, { name: "Biologic 3 air cleaner" }, { name: "Line set, pad, disconnect" }, { name: "Crane set" }, { name: "Permits and disposal" }, { name: "Warranty registration" }] },
    { label: "Option III", price: 19762, wasPrice: 23182, tax: 1011.5, description: "Full replacement", monthly: "$187", warranty: { big: "1 year labor", small: "10 years parts" },
      items: [{ name: "3 Ton condenser + air handler", detail: "14.3 SEER2" }, { name: "Biologic 3 air cleaner" }, { name: "Line set, pad, disconnect" }, { name: "Crane set" }, { name: "Permits and disposal" }, { name: "Warranty registration" }] },
    { label: "Option IV", price: 3180, wasPrice: 3741, tax: 181.72, description: "Repair only", monthly: "$89", warranty: { big: "1 year", small: "parts & labor" },
      items: [{ name: "Compressor capacitor", detail: "45/5 µF" }, { name: "Evaporator coil" }, { name: "R410A recharge", detail: "8 lb" }, { name: "Test and certify" }] },
  ],
  fine: <>Monthly figures through Ally at 7.99% APR over 144 months, subject to approval. Options I–III are over $15,000, so Florida law requires a signed Notice of Commencement before work starts — we prepare it. Terms on page 2. <b>Sign the column you choose.</b> All four options were offered to you.</>,
  preparedBy: "Gary W.",
};

export const SAMPLE_INVOICE: InvoiceSheetData = {
  number: "10247-I01", issued: "2 Oct 2026",
  billTo: { name: "Maria Sanchez", address: "12 Oak St, Tampa FL 33612", email: "maria.sanchez@gmail.com", phone: "(813) 555-0142" },
  job: { title: "10247-J01 · Full replacement", line: "Completed 2 Oct 2026 · Gary W.", sub: "Service at 12 Oak St, Tampa FL 33612" },
  fromEstimate: { title: "10247-E03 · Option III", line: "Accepted and signed 10 Sep 2026", sub: "Deposit of 10% received on signing" },
  lines: [
    { name: "3 Ton condenser + air handler", description: "Goodman, 14.3 SEER2 · serial 2409-771A · registered with Goodman for you", qty: 1, unitPrice: 12400, tax: 868, amount: 13268 },
    { name: "Biologic 3 air cleaner", description: "Installed on the return", qty: 1, unitPrice: 1150, tax: 80.5, amount: 1230.5 },
    { name: "Line set, pad, disconnect", description: "New refrigerant lines, composite pad, weatherproof disconnect", qty: 1, unitPrice: 900, tax: 63, amount: 963 },
    { name: "Crane set", description: "Rooftop lift, 2 Oct", qty: 1, unitPrice: 650, tax: null, amount: 650 },
    { name: "Permits and disposal", description: "Hillsborough County mechanical permit · old system removed and recycled", qty: 1, unitPrice: 480, tax: null, amount: 480 },
    { name: "Installation", description: "Two technicians, one day · start-up, pressures and temperatures on file", qty: 1, unitPrice: 3170.5, tax: null, amount: 3170.5 },
  ],
  total: 19762,
  payments: [{ label: "Deposit received 10 Sep 2026 · card ····4421", amount: 1976.2 }],
  balance: 17785.8,
  dueLine: "due 17 Oct 2026 · Net 15",
  payNote: "We take card, check and cash — the link to pay online is in your email. Financing through Ally at 7.99% APR over 144 months is still available for the balance; call us and we run it in a few minutes.",
  warranty: <><p><b>10 years parts</b> by Goodman, registered for you — nothing to send in. <b>1 year labor</b> by us: inside the term a warranty call costs you nothing.</p><p className="muted">Neither covers damage from misuse, power surges, or a system that has not been maintained.</p></>,
  notes: <p>Thermostat schedule set to your hours; filter size 20×25×1, change every 90 days. Your first maintenance visit is due in spring — we will call to schedule it.</p>,
  terms: <p>Tax is charged on equipment and materials at the Hillsborough County rate and shown per line; lines without a tax amount are not taxable. Questions about this invoice: {DEFAULT_CONTACT.phone} or {DEFAULT_CONTACT.contactLine.split(" · ")[1]}.</p>,
  createdBy: "Gary W.",
};

/** The warranty and payment blocks the sample's page 2 carries above the terms. */
export const SAMPLE_TERMS_SECTIONS = (
  <>
    <div className="sec" style={{ borderTop: "none" }}>
      <h3>What the warranty means</h3>
      <div className="two">
        <div><h4>Parts — by the manufacturer</h4><p>Runs from the day we install, not the day you buy. <b>We register it with Goodman for you</b> — you do not need to send anything in. If the part fails inside the term, the part is free.</p></div>
        <div><h4>Labor — by us</h4><p>Covers the visit and the work. Inside the labor term, a warranty call costs you nothing. Outside it, the part may still be free while the visit is charged.</p></div>
      </div>
      <p className="muted" style={{ marginTop: 6 }}>Neither covers damage from misuse, power surges, or a system that has not been maintained.</p>
    </div>
    <div className="sec">
      <h3>Payment</h3>
      <div className="four">
        <div><div className="k">Deposit on approval</div><div className="v">10%</div></div>
        <div><div className="k">Balance</div><div className="v">on completion</div></div>
        <div><div className="k">Financing through</div><div className="v">Ally</div></div>
        <div><div className="k">Rate / term</div><div className="v">7.99% · 144 mo</div></div>
      </div>
      <p className="muted" style={{ marginTop: 8 }}>We accept card, check and cash. Financing is subject to approval — we can run it here in a few minutes.</p>
    </div>
  </>
);
