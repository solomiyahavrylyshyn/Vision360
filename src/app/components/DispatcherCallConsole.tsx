import { useState } from "react";

// Click-through mockup of the dispatcher's "incoming call" screen, built from
// the call-center research brief: three zones (Customer → Problem →
// Schedule) the CSR/dispatcher moves through left-to-right, and five screen
// states demonstrating the known/unknown-caller and duplicate-detection
// flows. Illustrative only — no real data, no stores.

type CallState = "S1" | "S2" | "S3" | "S4" | "S5";
type CustomerKey = "randy" | "diane" | "julia";
type Trade = "AC" | "Plumbing" | "Electrical";

interface Equipment { label: string; serial: string; installed: string; ago: string; byUs: boolean; warranty: "ok" | "bad" | "na" }
interface HistoryRow { d: string; trade: Trade; desc: string; amt: string }
interface Customer {
  name: string; status: "active"; phone: string; email: string; addr: string; branch: string;
  equipment: Equipment[]; lastVisit: string; lastVisitAgo: string;
  membership: { tier: string; used: number; included: number };
  balance: { amount: number; verified: boolean };
  notes: string[]; history: HistoryRow[]; historyCount: number;
}

const CUSTOMERS: Record<CustomerKey, Customer> = {
  randy: {
    name: "Randy Johnson", status: "active", phone: "(813) 456-7890", email: "randy@mail.com",
    addr: "5010 N Cortez Ave, Tampa, FL 33614", branch: "Tampa",
    equipment: [
      { label: "Goodman condenser", serial: "3009874512", installed: "03/12/2023", ago: "2 years ago", byUs: true, warranty: "ok" },
      { label: "Air handler", serial: "3009874513", installed: "03/12/2023", ago: "2 years ago", byUs: true, warranty: "ok" },
    ],
    lastVisit: "05/14/2026", lastVisitAgo: "3 months ago", membership: { tier: "Silver", used: 1, included: 2 },
    balance: { amount: 0, verified: true },
    notes: ["👶 Infant in home — do not ring the doorbell", "🐕 Dog in yard"],
    history: [
      { d: "05/14/2026", trade: "AC", desc: "Tune-up", amt: "$99" },
      { d: "11/02/2025", trade: "AC", desc: "Capacitor replacement", amt: "$180" },
      { d: "03/12/2023", trade: "AC", desc: "System install", amt: "$6,995" },
    ], historyCount: 12,
  },
  diane: {
    name: "Diane Medeiros", status: "active", phone: "(727) 415-3481", email: "diane.m@mail.com",
    addr: "255 Standish Dr, Tampa, FL 33615", branch: "Tampa",
    equipment: [{ label: "Carrier condenser (not ours)", serial: "—", installed: "unknown", ago: "", byUs: false, warranty: "na" }],
    lastVisit: "06/2019", lastVisitAgo: "6 years ago", membership: { tier: "None", used: 0, included: 0 },
    balance: { amount: 0, verified: true },
    notes: ["No prior relationship with our install team"],
    history: [{ d: "06/2019", trade: "AC", desc: "Diagnostic — third-party system", amt: "$89" }], historyCount: 1,
  },
  julia: {
    name: "Julia Stephens", status: "active", phone: "(352) 258-9710", email: "julia.s@mail.com",
    addr: "4407 Main St, Brandon, FL", branch: "Brandon",
    equipment: [{ label: "Trane condenser", serial: "7741-A29", installed: "01/2016", ago: "9 years ago", byUs: true, warranty: "bad" }],
    lastVisit: "02/2025", lastVisitAgo: "1 year ago", membership: { tier: "Gold", used: 2, included: 2 },
    balance: { amount: 1214, verified: false },
    notes: ["Balance disputed once before — check ledger before quoting"],
    history: [{ d: "02/2025", trade: "Plumbing", desc: "Water heater repair", amt: "$420" }], historyCount: 5,
  },
};

const STATES: { key: CallState; label: string }[] = [
  { key: "S1", label: "Idle" },
  { key: "S2", label: "Incoming — known" },
  { key: "S3", label: "Incoming — unknown" },
  { key: "S4", label: "Manual search" },
  { key: "S5", label: "Duplicate warning" },
];

function Badge({ tone, children, title }: { tone: "ok" | "warn" | "critical" | "muted" | "teal"; children: React.ReactNode; title?: string }) {
  const map = {
    ok: "bg-[#E4F1E7] text-[#16A34A]", warn: "bg-[#FCF0D9] text-[#B45309]", critical: "bg-[#FBE7E7] text-[#DC2626]",
    teal: "bg-[#EBF0F8] text-[#4A6FA5]", muted: "bg-[#F5F7FA] text-[#8899AA] border border-[#E5E7EB]",
  } as const;
  return <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${map[tone]}`} style={{ fontWeight: 700 }}>{children}</span>;
}

function Card({ title, tip, children }: { title?: string; tip?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      {title && <div className="mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }} title={tip}>{title}</div>}
      {children}
    </div>
  );
}

export function DispatcherCallConsole({ onClose }: { onClose: () => void }) {
  const [callState, setCallState] = useState<CallState>("S1");
  const [customerKey, setCustomerKey] = useState<CustomerKey>("randy");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dupModalOpen, setDupModalOpen] = useState(false);

  // Zone B — symptom tree
  const [root, setRoot] = useState<string | null>(null);
  const [leakWhere, setLeakWhere] = useState<string | null>(null);
  const [leakAttic, setLeakAttic] = useState<boolean | null>(null);
  const [leakBill, setLeakBill] = useState<boolean | null>(null);
  const [breaker, setBreaker] = useState<string | null>(null);
  const [tradeOverride, setTradeOverride] = useState<Trade | "">("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");
  const [mods, setMods] = useState<Record<string, boolean>>({});

  // Zone C
  const [slot, setSlot] = useState<number | null>(null);
  const [smsOn, setSmsOn] = useState(true);
  const [saved, setSaved] = useState(false);

  // Zone A' — new client
  const [newLastName, setNewLastName] = useState("");
  const [newAddr1, setNewAddr1] = useState("");

  const customer = CUSTOMERS[customerKey];

  const goState = (s: CallState) => {
    setCallState(s);
    setDupModalOpen(false);
    if (s === "S5") { setNewLastName("Johnson"); setNewAddr1("5010 N Cortez Ave"); setDupModalOpen(true); }
    if (s === "S3") { setNewLastName(""); setNewAddr1(""); }
    if (s === "S4") setSearchQuery("");
  };

  const [searchQuery, setSearchQuery] = useState("");
  const SEARCH_INDEX: { q: string; c: CustomerKey }[] = [
    { q: "813", c: "randy" }, { q: "cortez", c: "randy" }, { q: "randy", c: "randy" }, { q: "johnson", c: "randy" },
    { q: "727", c: "diane" }, { q: "standish", c: "diane" }, { q: "medeiros", c: "diane" },
    { q: "352", c: "julia" }, { q: "main st", c: "julia" }, { q: "stephens", c: "julia" },
  ];
  const searchHit = searchQuery.trim().length >= 2 ? SEARCH_INDEX.find((r) => r.q.includes(searchQuery.toLowerCase()) || searchQuery.toLowerCase().includes(r.q)) : undefined;

  // Suggestion engine
  let suggestion: { trade: Trade; icon: string; conf: number; reason: string } | null = null;
  if (root === "leak") {
    if (leakWhere === "ceiling" && leakAttic === true) suggestion = { trade: "AC", icon: "🌀", conf: 82, reason: "leaking from the ceiling + indoor unit in the attic." };
    else if (leakBill === true) suggestion = { trade: "Plumbing", icon: "🚿", conf: 75, reason: "the water bill jumped recently." };
    else if (leakWhere === "sink") suggestion = { trade: "Plumbing", icon: "🚿", conf: 88, reason: "leak located under a sink or appliance." };
    else if (leakWhere === "outside") suggestion = { trade: "AC", icon: "🌀", conf: 70, reason: "exterior leak — likely a condensate line, not urgent." };
  } else if (root === "breaker") {
    if (breaker === "ac") suggestion = { trade: "AC", icon: "🌀", conf: 85, reason: "the AC breaker is the one tripping." };
    else if (breaker === "wh") suggestion = { trade: "Plumbing", icon: "🚿", conf: 85, reason: "the water heater breaker is the one tripping." };
    else if (breaker === "unsure") suggestion = { trade: "Electrical", icon: "⚡", conf: 60, reason: "customer isn't sure which circuit — needs an electrician to trace it." };
  } else if (root === "nocool") suggestion = { trade: "AC", icon: "🌀", conf: 95, reason: "always: not cooling/heating points straight to AC." };
  else if (root === "nowater") suggestion = { trade: "Plumbing", icon: "🚿", conf: 95, reason: "always: no water points straight to plumbing." };
  else if (root === "nopower") suggestion = { trade: "Electrical", icon: "⚡", conf: 95, reason: "always: dead power points straight to electrical." };

  const trade = tradeOverride || suggestion?.trade || "";

  // Urgency
  let base = 0, urgencyLabel = "";
  if (root === "leak" && leakWhere === "ceiling") { base = 4; urgencyLabel = "water reaching the ceiling"; }
  else if (root === "nowater") { base = 3; urgencyLabel = "no hot water"; }
  else if (root === "nocool") { base = 3; urgencyLabel = "no cooling/heating"; }
  else if (root === "nopower") { base = 3; urgencyLabel = "no power"; }
  else if (root === "breaker") { base = 2; urgencyLabel = "breaker trips"; }
  else if (root === "leak") { base = 2; urgencyLabel = "contained leak"; }
  else if (root === "noise") { base = 2; urgencyLabel = "unusual noise"; }
  const modLabels: Record<string, string> = { age: "customer 65+", infant: "infant in home", heat: "32°C+ today", old: "equipment 15+ yrs" };
  const activeMods = Object.keys(mods).filter((k) => mods[k]);
  const urgency = base === 0 ? 0 : Math.min(base + activeMods.length, 4);
  const urgencyTone: "muted" | "teal" | "warn" | "critical" = urgency === 0 ? "muted" : urgency >= 4 ? "critical" : urgency === 3 ? "warn" : "teal";

  const isWarranty = customer.equipment[0]?.byUs && customer.equipment[0]?.warranty === "ok";

  const effectiveDescription = description.trim() || (suggestion ? `Because: ${suggestion.reason}` : "");
  const missing: string[] = [];
  if (!trade) missing.push("trade"); if (!jobType) missing.push("job type");
  if (slot === null) missing.push("time slot"); if (!effectiveDescription) missing.push("description");
  const canSave = missing.length === 0;

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center overflow-y-auto bg-[#1A2332]/70 py-6 backdrop-blur-sm">
      <div className="mb-3 flex w-full max-w-[1180px] items-center gap-3 px-2 text-white">
        <span className="material-icons" style={{ fontSize: "20px" }}>support_agent</span>
        <span className="text-[14px]" style={{ fontWeight: 600 }}>Dispatcher — incoming call console (interactive mockup)</span>
        <button onClick={onClose} className="ml-auto rounded-md bg-white/15 px-3 py-1.5 text-[13px] text-white hover:bg-white/25" style={{ fontWeight: 600 }}>
          Exit demo
        </button>
      </div>

      <div className="w-full max-w-[1180px] rounded-2xl border border-[#E5E7EB] bg-[#F5F7FA] p-5 shadow-2xl">
        {/* state switcher */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => goState(s.key)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] ${callState === s.key ? "border-[#1A2332] bg-[#1A2332] text-white" : "border-[#E5E7EB] bg-white text-[#546478]"}`}
              style={{ fontWeight: 600 }}
            >
              <span className={callState === s.key ? "text-[#F4B67C]" : "text-[#4A6FA5]"} style={{ fontWeight: 700 }}>{s.key}</span> {s.label}
            </button>
          ))}
        </div>
        {callState === "S2" && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["randy", "diane", "julia"] as CustomerKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setCustomerKey(k)}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${customerKey === k ? "border-[#4A6FA5] bg-[#EBF0F8] text-[#4A6FA5]" : "border-dashed border-[#C8D5E8] text-[#8899AA]"}`}
                style={{ fontWeight: 600 }}
              >
                {CUSTOMERS[k].name}{k === "diane" ? " — not our equipment" : k === "julia" ? " — unverified balance" : " — good record"}
              </button>
            ))}
          </div>
        )}
        <div className="mb-3 text-[11px] text-[#8899AA]">
          Rule of the screen: <span className="text-[#1A2332]" style={{ fontWeight: 700 }}>the dispatcher moves left → right and never goes back.</span>
        </div>

        {/* three zones */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ZONE A */}
          <div className="space-y-3 border-l border-dashed border-transparent lg:pr-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#1A2332] text-[13px] text-white" style={{ fontWeight: 700 }}>A</span>
              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Customer</span>
              <span className="text-[11px] text-[#8899AA]">who is this</span>
            </div>

            {callState === "S1" && (
              <Card>
                <div className="text-[13px] text-[#8899AA]">No call in progress.</div>
                <input placeholder="Search by phone, name, or address…" className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[13px] outline-none" />
              </Card>
            )}

            {callState === "S4" && (
              <Card title="Manual search">
                <input
                  autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Try "813" or "Cortez"…'
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[13px] outline-none"
                />
                <div className="mt-2">
                  {searchQuery.trim().length >= 2 && !searchHit && <div className="text-[12px] text-[#8899AA]">No match yet — tolerant of format, partial address, and typos.</div>}
                  {searchHit && (
                    <button
                      onClick={() => { setCallState("S2"); setCustomerKey(searchHit.c); }}
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-left hover:border-[#4A6FA5]"
                    >
                      <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{CUSTOMERS[searchHit.c].name}</div>
                      <div className="text-[11px] text-[#8899AA]">{CUSTOMERS[searchHit.c].phone} · {CUSTOMERS[searchHit.c].addr}</div>
                    </button>
                  )}
                </div>
              </Card>
            )}

            {callState === "S2" && (
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[17px] text-[#1A2332]" style={{ fontWeight: 700 }}>{customer.name}</div>
                    <div className="text-[11.5px] text-[#8899AA]">{customer.phone} · {customer.email}</div>
                    <div className="text-[12px] text-[#546478]">{customer.addr}</div>
                  </div>
                  <Badge tone="ok">✓ Active</Badge>
                </div>

                <div className="mt-3 border-t border-[#EDF0F5] pt-2.5">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }} title="Closes D1, S6, C4 — never ask “did we install this?” again">⚡ Our equipment</div>
                  {customer.equipment.map((e) => (
                    <div key={e.label} className="flex items-start justify-between gap-2 py-1 text-[12.5px]">
                      <div>
                        <div className="text-[#1A2332]">{e.label}</div>
                        <div className="font-mono text-[10.5px] text-[#8899AA]">SN {e.serial} · {e.installed}{e.ago ? ` (${e.ago})` : ""}{e.byUs ? " · BY US" : ""}</div>
                      </div>
                      {e.warranty === "na" ? null : (
                        <span className="whitespace-nowrap text-[11px]" style={{ color: e.warranty === "ok" ? "#16A34A" : "#DC2626" }}>
                          ● {e.warranty === "ok" ? "Warranty active" : "Warranty expired"}
                        </span>
                      )}
                    </div>
                  ))}
                  {customer.equipment.some((e) => e.warranty === "na") && <div className="mt-1"><Badge tone="critical">Not installed by us — billable visit</Badge></div>}
                </div>

                <div className="mt-3 border-t border-[#EDF0F5] pt-2.5">
                  <div className="mb-1.5 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>🔧 Service</div>
                  <div className="flex justify-between text-[12.5px]"><span className="text-[#8899AA]">Last visit</span><span>{customer.lastVisit} ({customer.lastVisitAgo})</span></div>
                  <div className="flex justify-between text-[12.5px]"><span className="text-[#8899AA]">Membership</span><span>{customer.membership.tier === "None" ? "None" : `${customer.membership.tier} · ${customer.membership.used} of ${customer.membership.included} used`}</span></div>
                </div>

                <div className="mt-3 border-t border-[#EDF0F5] pt-2.5">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }} title="PRC3 / SY1 — never turn someone away over a balance that isn't real">💰 Balance</div>
                  {customer.balance.verified ? (
                    <>
                      <div className="font-mono text-[16px] text-[#1A2332]" style={{ fontWeight: 700 }}>${customer.balance.amount.toFixed(2)}</div>
                      <Badge tone="ok">✓ Verified against ledger</Badge>
                    </>
                  ) : (
                    <>
                      <div className="text-[13px] italic text-[#8899AA]" style={{ fontWeight: 600 }} title="Not shown as a number until confirmed — a stale rewritten invoice shouldn't turn a customer away">Pending review</div>
                      <Badge tone="warn">⚠ Unverified — do not quote</Badge>
                    </>
                  )}
                </div>

                {customer.notes.length > 0 && (
                  <div className="mt-3 border-t border-[#EDF0F5] pt-2.5">
                    <div className="mb-1.5 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>⚠ Notes — private, never on customer documents</div>
                    <div className="space-y-1 rounded-lg bg-[#FCF0D9] p-2.5 text-[12px] text-[#9A6B12]">
                      {customer.notes.map((n) => <div key={n}>{n}</div>)}
                    </div>
                  </div>
                )}

                <div className="mt-3 border-t border-[#EDF0F5] pt-2.5">
                  <button onClick={() => setHistoryOpen((v) => !v)} className="flex items-center gap-1 text-[11.5px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>
                    <span className="material-icons" style={{ fontSize: "14px", transform: historyOpen ? "rotate(90deg)" : "none" }}>chevron_right</span>
                    History ({customer.historyCount} jobs)
                  </button>
                  {historyOpen && (
                    <div className="mt-1.5 space-y-1">
                      {customer.history.map((h) => (
                        <div key={h.d + h.desc} className="flex items-center gap-2 border-t border-dotted border-[#EDF0F5] py-1 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: h.trade === "AC" ? "#4A6FA5" : h.trade === "Plumbing" ? "#B45309" : "#DC2626" }} />
                          <span className="w-16 font-mono text-[10px] text-[#8899AA]">{h.d}</span>
                          <span className="flex-1 text-[#546478]">{h.desc}</span>
                          <span className="font-mono">{h.amt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {(callState === "S3" || callState === "S5") && (
              <Card title="New client">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="First name" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                    <input
                      placeholder="Last name" value={newLastName}
                      onChange={(e) => { setNewLastName(e.target.value); if ((e.target.value.trim().toLowerCase() === "johnson" || newAddr1.toLowerCase().includes("cortez"))) setDupModalOpen(true); }}
                      className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none"
                    />
                  </div>
                  <input value={callState === "S5" ? "(813) 555-0198" : "(813) 555-0142"} readOnly className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 font-mono text-[13px] outline-none" />
                  <input
                    placeholder="Address line 1 — autocomplete validates it exists" value={newAddr1}
                    onChange={(e) => { setNewAddr1(e.target.value); if (newLastName.trim().toLowerCase() === "johnson" || e.target.value.toLowerCase().includes("cortez")) setDupModalOpen(true); }}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input defaultValue="Tampa" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                    <input defaultValue="FL" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                    <input defaultValue="33614" className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none" />
                  </div>
                  <div className="text-[11px] text-[#8899AA]">County: <span className="text-[#4A6FA5]" style={{ fontWeight: 600 }}>Hillsborough</span> — filled automatically from the address</div>
                  <select defaultValue="Referral" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none">
                    <option>Google search</option><option>Referral</option><option>Repeat customer</option><option>Other</option>
                  </select>
                  <div className="rounded-lg bg-[#F5F7FA] p-2.5 text-[11px] text-[#8899AA]">
                    ⚠ House details pull from the <span className="text-[#1A2332]" style={{ fontWeight: 600 }}>county property appraiser</span>, not Zillow — Zillow's square footage includes the garage and porch, which throws off tonnage sizing.
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ZONE B */}
          <div className="space-y-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#1A2332] text-[13px] text-white" style={{ fontWeight: 700 }}>B</span>
              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Problem</span>
              <span className="text-[11px] text-[#8899AA]">what happened</span>
            </div>

            <Card title="Symptom" tip="This tree mirrors how a dispatcher already talks through a call — not an invented script.">
              <div className="mb-1.5 text-[12.5px] text-[#1A2332]" style={{ fontWeight: 700 }}>What's going on?</div>
              <div className="flex flex-wrap gap-1.5">
                {[["leak", "Leaking water"], ["breaker", "Breaker trips"], ["nocool", "Not cooling / heating"], ["nowater", "No water / hot water"], ["nopower", "No power / dead outlet"], ["noise", "Strange noise"], ["unknown", "Customer can't describe it"]].map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => { setRoot(k); setLeakWhere(null); setLeakAttic(null); setLeakBill(null); setBreaker(null); setTradeOverride(""); }}
                    className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${root === k ? "border-[#4A6FA5] bg-[#4A6FA5] text-white" : "border-[#E5E7EB] bg-[#F9FAFB] text-[#1A2332]"}`}
                    style={{ fontWeight: 600 }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {root === "leak" && (
                <div className="mt-3 space-y-2.5 border-l-2 border-[#EDF0F5] pl-3">
                  <div>
                    <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>Where is it leaking from?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[["ceiling", "From the ceiling"], ["sink", "Under a sink / appliance"], ["outside", "Outside the house"], ["unsure", "Not sure"]].map(([k, label]) => (
                        <button key={k} onClick={() => setLeakWhere(k)} className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${leakWhere === k ? "border-[#4A6FA5] bg-[#4A6FA5] text-white" : "border-[#E5E7EB] bg-[#F9FAFB]"}`} style={{ fontWeight: 600 }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>Is the AC's indoor unit in the attic or a ceiling closet?</div>
                    <div className="flex gap-1.5">
                      {[[true, "Yes"], [false, "No"]].map(([v, label]) => (
                        <button key={String(v)} onClick={() => setLeakAttic(v as boolean)} className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${leakAttic === v ? "border-[#4A6FA5] bg-[#4A6FA5] text-white" : "border-[#E5E7EB] bg-[#F9FAFB]"}`} style={{ fontWeight: 600 }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>Has the water bill jumped recently?</div>
                    <div className="flex gap-1.5">
                      {[[true, "Yes"], [false, "No"]].map(([v, label]) => (
                        <button key={String(v)} onClick={() => setLeakBill(v as boolean)} className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${leakBill === v ? "border-[#4A6FA5] bg-[#4A6FA5] text-white" : "border-[#E5E7EB] bg-[#F9FAFB]"}`} style={{ fontWeight: 600 }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {root === "breaker" && (
                <div className="mt-3 space-y-2.5 border-l-2 border-[#EDF0F5] pl-3">
                  <div>
                    <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 600 }}>Which breaker?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[["ac", "AC"], ["wh", "Water heater"], ["unsure", "Not sure / unlabeled"]].map(([k, label]) => (
                        <button key={k} onClick={() => setBreaker(k)} className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${breaker === k ? "border-[#4A6FA5] bg-[#4A6FA5] text-white" : "border-[#E5E7EB] bg-[#F9FAFB]"}`} style={{ fontWeight: 600 }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {root === "noise" && <div className="mt-3 rounded-lg bg-[#EBF0F8] p-2.5 text-[11.5px] text-[#4A6FA5]">💡 If the unit is less than a year old, a startup hum is often normal — worth ruling out on the phone before booking a visit.</div>}
              {root === "unknown" && <div className="mt-3 rounded-lg bg-[#EBF0F8] p-2.5 text-[11.5px] text-[#4A6FA5]">💡 Ask the customer to stand next to the equipment and describe what they see — most "I don't know" calls resolve to a clear symptom this way.</div>}

              {suggestion && (
                <div className="mt-3 border-t border-[#EDF0F5] pt-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>System suggestion</span>
                    <span className="font-mono text-[10.5px] text-[#8899AA]">confidence {suggestion.conf}%</span>
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[16px]">{suggestion.icon}</span>
                    <select value={trade} onChange={(e) => setTradeOverride(e.target.value as Trade)} className="rounded-lg border border-[#4A6FA5] px-2.5 py-1 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                      <option>AC</option><option>Plumbing</option><option>Electrical</option>
                    </select>
                  </div>
                  <div className="text-[11px] text-[#8899AA]">Because: {suggestion.reason} The dispatcher always confirms or changes this.</div>
                </div>
              )}
            </Card>

            <Card title="Job fields">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>Job type</div>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] outline-none">
                    <option value="">Select…</option><option value="demand">Demand service</option><option value="maintenance">Maintenance</option><option value="estimate">Estimate</option><option value="warranty">Warranty</option>
                  </select>
                </div>
                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>Trade</div>
                  <input readOnly value={trade} className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 font-mono text-[12.5px]" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="mb-1 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }}>Description</div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={suggestion ? `Because: ${suggestion.reason}` : "Builds itself from the tree above — editable"} className="w-full resize-none rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[12.5px] outline-none" />
              </div>

              <div className="mt-3 text-[10px] uppercase tracking-wide text-[#8899AA]" style={{ fontWeight: 700 }} title="Megan / SSA Inverness: symptom + who's vulnerable decides how urgent it is">Urgency modifiers</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[["age", "Customer 65+"], ["infant", "Infant in home"], ["heat", "32°C+ outside today"], ["old", "Equipment 15+ yrs old"]].map(([k, label]) => (
                  <button key={k} onClick={() => setMods((m) => ({ ...m, [k]: !m[k] }))} className={`rounded-full border px-2.5 py-1 text-[11px] ${mods[k] ? "border-[#DC2626] bg-[#FBE7E7] text-[#DC2626]" : "border-[#E5E7EB] bg-[#F9FAFB] text-[#546478]"}`} style={{ fontWeight: 600 }}>{label}</button>
                ))}
              </div>
              <div className="mt-2.5 border-t border-[#EDF0F5] pt-2.5">
                <Badge tone={urgencyTone}>{urgency === 0 ? "Urgency — pick a symptom" : `Urgency ${urgency}/4 — ${urgencyLabel}${activeMods.length ? " + " + activeMods.map((k) => modLabels[k]).join(" + ") : ""}`}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={isWarranty ? "ok" : "muted"}>isWarranty: {isWarranty ? "Yes" : "No"}</Badge>
                <Badge tone="muted">isCallback: No</Badge>
              </div>
            </Card>
          </div>

          {/* ZONE C */}
          <div className="space-y-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#1A2332] text-[13px] text-white" style={{ fontWeight: 700 }}>C</span>
              <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Schedule</span>
              <span className="text-[11px] text-[#8899AA]">when we arrive</span>
            </div>

            <Card title="When we're coming" tip="Not a map — that's dispatch routing's tool. The dispatcher needs one answer: does it fit the day.">
              <div className="mb-2.5 flex items-center justify-between text-[11.5px] text-[#8899AA]">
                <span title="Today every call lands in a shared pending-AC queue and gets re-sorted by hand">Branch — auto-assigned by address</span>
                <span className="text-[#1A2332]" style={{ fontWeight: 700 }}>{callState === "S2" ? customer.branch : "Tampa"}</span>
              </div>
              <div className="space-y-1.5">
                {[["Today 14:00–18:00", "2 techs free"], ["Tomorrow 08:00–12:00", "3 techs free"], ["Tomorrow 12:00–16:00", "1 tech free"]].map((s, i) => (
                  <button key={s[0]} onClick={() => setSlot(i)} className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left ${slot === i ? "border-[#4A6FA5] bg-[#EBF0F8]" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
                    <span className={`h-3.5 w-3.5 rounded-full border-2 ${slot === i ? "border-[#4A6FA5] bg-[#4A6FA5]" : "border-[#C8D5E8]"}`} />
                    <span className="flex-1 font-mono text-[12.5px]" style={{ fontWeight: 600 }}>{s[0]}</span>
                    <span className="text-[10.5px] text-[#16A34A]" style={{ fontWeight: 600 }}>✓ {s[1]}</span>
                  </button>
                ))}
              </div>
              <label className="mt-2.5 flex items-center gap-2 text-[12px] text-[#546478]">
                <input type="checkbox" checked={smsOn} onChange={() => setSmsOn((v) => !v)} /> Send SMS confirmation link
              </label>
            </Card>

            <Card>
              <button
                disabled={!canSave}
                onClick={() => setSaved(true)}
                className="w-full rounded-lg bg-[#4A6FA5] py-2.5 text-[13px] text-white disabled:opacity-40"
                style={{ fontWeight: 700 }}
              >
                Save job
              </button>
              <div className="mt-1.5 text-[11px] text-[#8899AA]">
                {canSave ? "Ready to save." : <>Needs: {missing.map((m, i) => <span key={m} className="text-[#DC2626]">{m}{i < missing.length - 1 ? ", " : ""}</span>)}.</>}
              </div>
              {saved && (
                <div className="mt-2.5 rounded-lg bg-[#E4F1E7] p-2.5 text-[11.5px] text-[#16A34A]">
                  ✓ Job created → assigned to <span style={{ fontWeight: 700 }}>{callState === "S2" ? customer.branch : "Tampa"}</span> board.<br />
                  Flags applied automatically; SMS sent if checked.
                  <div className="mt-1 font-mono text-[10px] text-[#8899AA]">Created by: J. Alvarez (Dispatcher) · via incoming call · logged just now</div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#1A2332] p-4 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-mono text-[12px] text-[#B7C2C0]">A <span className="text-[#7FD1B0]">─▶</span> B <span className="text-[#7FD1B0]">─▶</span> C — one screen, never backtracked</div>
            <div className="ml-auto max-w-[380px] text-[12px] italic text-[#B7C2C0]">"How big of an emergency is it — that determines how soon we need to get out there." — SSA, Inverness</div>
          </div>
        </div>
      </div>

      {dupModalOpen && (
        <div className="fixed inset-0 z-[4100] flex items-center justify-center bg-[#1A2332]/60 p-5" onClick={() => setDupModalOpen(false)}>
          <div className="w-full max-w-[420px] rounded-xl border border-[#E5E7EB] bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center gap-2 text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>⚠ Possible match</div>
            <div className="mb-3 text-[12px] text-[#8899AA]">Triggered while typing — before anything is saved.</div>
            <div className="mb-3.5 rounded-lg border border-[#E3C77C] bg-[#FCF0D9] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Randy Johnson</span>
                <span className="font-mono text-[13px] text-[#9A6B12]" style={{ fontWeight: 700 }}>91%</span>
              </div>
              <div className="mt-1 text-[12px] text-[#8899AA]">(813) 456-7890 · 5010 N Cortez Ave, Tampa<br />Last visit 05/14/2026 · 12 jobs on file</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { setDupModalOpen(false); setCallState("S2"); setCustomerKey("randy"); }} className="rounded-lg bg-[#4A6FA5] py-2 text-[12.5px] text-white" style={{ fontWeight: 700 }}>It's them — open the record</button>
              <button onClick={() => setDupModalOpen(false)} className="rounded-lg border border-[#E5E7EB] py-2 text-[12.5px] text-[#1A2332]" style={{ fontWeight: 600 }}>Different person — same name</button>
              <button onClick={() => setDupModalOpen(false)} className="rounded-lg border border-[#E5E7EB] py-2 text-[12.5px] text-[#1A2332]" style={{ fontWeight: 600 }}>New service location, same customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
