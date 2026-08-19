import { useState } from "react";

// Lightweight, click-through mockup of the technician mobile app (Figma
// "Figma_Mobile" set). Purely illustrative — no real data, no stores — used
// from the Help Center's "Play as Technician" role sandbox. Scoped to what a
// Technician can actually see (General / Report Card, no Estimate / Finance
// tabs — pricing is a Field Salesperson permission).

type Screen = "history" | "filter" | "search" | "job" | "media" | "imageDesc";
type JobTab = "general" | "notes" | "report";
type Status = "none" | "enroute" | "working" | "done";

const jobs = [
  { name: "Randy Johnson", date: "Dec 1, 2025", badge: "Estimate", color: "#16A34A", addr: "5010 N Cortez Ave, Tampa, FL 33614", phone: "(813) 456-7890", range: "$79.00 - $3,509.00" },
  { name: "Brent Kenzie", date: "Dec 12, 2025", badge: "Maintenance", color: "#D97706", addr: "4407 Main St, Brandon, FL 33594", phone: "(727) 415-3481", range: "$929.00 - $1,109.00" },
  { name: "Joseph Lane", date: "Dec 23, 2025", badge: "Demand Service", color: "#4A6FA5", addr: "255 Standish Drive, Tampa, FL 33615", phone: "(352) 258-9710", range: "$428.00 - $18,525.00" },
];

const reportSections = [
  { title: "Household Analysis", fields: [["Thermostat setting", "74F"], ["Average electric bill", "~$325"], ["House sq ft", "2100"]] },
  { title: "Comfort Analysis", fields: [["Filter type", "Pleated"], ["Filter condition", "Needs attention"], ["Attic insulation", "R-30"]] },
  { title: "System Analysis", fields: [["Type", "Furnace"], ["Brand", "Daikin — 2017"], ["Static pressure", "0.00"]] },
  { title: "Customer Section", fields: [["Signature", "— tap to sign —"]] },
  { title: "Technician Section", fields: [["Tech notes", "Checked in after recent pipe repair — client confirmed working well with no further leaks."]] },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>
      <span>9:30</span>
      <div className="flex items-center gap-1">
        <span className="material-icons" style={{ fontSize: "13px" }}>signal_cellular_alt</span>
        <span className="material-icons" style={{ fontSize: "13px" }}>wifi</span>
        <span className="material-icons" style={{ fontSize: "13px" }}>battery_full</span>
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { key: "home", label: "Home", icon: "home" },
    { key: "history", label: "History", icon: "history" },
    { key: "chat", label: "Chat", icon: "chat_bubble_outline" },
    { key: "timesheet", label: "Timesheet", icon: "schedule" },
    { key: "more", label: "More", icon: "more_horiz" },
  ];
  return (
    <div className="flex border-t border-[#E5E7EB] bg-white px-1 pb-2 pt-1.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => it.key !== "history" && it.key !== active && window.alert(`"${it.label}" isn't wired up in this quick mockup.`)}
          className="flex flex-1 flex-col items-center gap-0.5 py-1"
        >
          <span className="material-icons" style={{ fontSize: "18px", color: it.key === active ? "#4A6FA5" : "#9CA3AF" }}>{it.icon}</span>
          <span className="text-[9px]" style={{ color: it.key === active ? "#4A6FA5" : "#9CA3AF", fontWeight: it.key === active ? 600 : 500 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2.5">
      {onBack && (
        <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
          <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>arrow_back</span>
        </button>
      )}
      <span className="flex-1 text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{title}</span>
      {right}
    </div>
  );
}

export function TechnicianMobileDemo({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("history");
  const [jobTab, setJobTab] = useState<JobTab>("general");
  const [status, setStatus] = useState<Status>("none");
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [addPhotoMenuOpen, setAddPhotoMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [query, setQuery] = useState("");

  const statusLabel = { none: null, enroute: "En route", working: "Working", done: "Done — sent for review" }[status];
  const statusColor = { none: "", enroute: "#D97706", working: "#4A6FA5", done: "#16A34A" }[status];

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center bg-[#1A2332]/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="mb-4 flex items-center gap-3 text-white">
        <span className="material-icons" style={{ fontSize: "20px" }}>smartphone</span>
        <span className="text-[14px]" style={{ fontWeight: 600 }}>Technician mobile app — interactive mockup</span>
        <button onClick={onClose} className="ml-4 rounded-md bg-white/15 px-3 py-1.5 text-[13px] text-white hover:bg-white/25" style={{ fontWeight: 600 }}>
          Exit demo
        </button>
      </div>

      {/* Phone frame */}
      <div className="w-[340px] shrink-0 overflow-hidden rounded-[36px] border-[6px] border-[#111827] bg-white shadow-2xl">
        <div className="flex h-[700px] flex-col">
          <StatusBar />

          {/* ---- History ---- */}
          {screen === "history" && (
            <>
              <Header
                title="Jobs history"
                right={
                  <div className="flex items-center gap-1">
                    <button onClick={() => setScreen("filter")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>tune</span>
                    </button>
                    <button onClick={() => setScreen("search")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#1A2332]" style={{ fontSize: "18px" }}>search</span>
                    </button>
                  </div>
                }
              />
              <div className="flex gap-2 px-3 py-2">
                {["Today", "Week", "Month", "Quarter"].map((t, i) => (
                  <span key={t} className={`rounded-full px-3 py-1 text-[12px] ${i === 0 ? "bg-[#4A6FA5] text-white" : "bg-[#F5F7FA] text-[#546478]"}`} style={{ fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
                {jobs.map((j) => (
                  <div key={j.name} className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>{j.name}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: j.color, fontWeight: 600 }}>{j.badge}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#8899AA]">{j.date}</div>
                    <div className="mt-1.5 text-[12px] text-[#546478]">{j.addr}</div>
                    <div className="text-[12px] text-[#546478]">{j.phone}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <button onClick={() => { setScreen("job"); setJobTab("general"); }} className="rounded-full border border-[#E5E7EB] px-3 py-1 text-[11px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                        Job Details
                      </button>
                      <span className="text-[11px] text-[#8899AA]">Range: <span style={{ fontWeight: 700, color: "#1A2332" }}>{j.range}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <BottomNav active="history" />
            </>
          )}

          {/* ---- Filter ---- */}
          {screen === "filter" && (
            <>
              <Header title="Filter" onBack={() => setScreen("history")} right={<span className="text-[12px] text-[#4A6FA5]" style={{ fontWeight: 600 }}>Reset filters</span>} />
              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div>
                  <div className="mb-2 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Follow-ups</div>
                  <div className="flex items-center gap-2 text-[12px] text-[#546478]">
                    <span className="flex h-5 w-9 items-center rounded-full bg-[#4A6FA5] px-0.5"><span className="h-4 w-4 rounded-full bg-white" /></span>
                    Show only follow-ups
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>
                    <span>Price range</span><span className="text-[#8899AA]" style={{ fontWeight: 500 }}>$6,000–$15,000</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E5E7EB]"><div className="h-1.5 w-1/2 rounded-full bg-[#4A6FA5]" /></div>
                </div>
                <div>
                  <div className="mb-2 text-[13px] text-[#1A2332]" style={{ fontWeight: 700 }}>Estimate status</div>
                  {["Pending", "Rejected", "Accepted"].map((s) => (
                    <label key={s} className="mb-1.5 flex items-center gap-2 text-[13px] text-[#546478]">
                      <input type="checkbox" className="h-4 w-4" /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <BottomNav active="history" />
            </>
          )}

          {/* ---- Search ---- */}
          {screen === "search" && (
            <>
              <Header title="" onBack={() => setScreen("history")} right={
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[13px] outline-none" />
              } />
              <div className="flex-1 overflow-y-auto p-2">
                {["Julia Robinson", "Julia Stephens"].filter((n) => n.toLowerCase().includes(query.toLowerCase())).map((n) => (
                  <div key={n} className="flex items-center gap-2 rounded-lg px-2 py-2.5 hover:bg-[#F5F7FA]">
                    <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                    <span className="text-[13px] text-[#1A2332]">{n}</span>
                  </div>
                ))}
              </div>
              <BottomNav active="history" />
            </>
          )}

          {/* ---- Job ---- */}
          {screen === "job" && (
            <>
              <Header
                title="Job"
                onBack={() => setScreen("history")}
                right={
                  status === "none" ? (
                    <div className="relative">
                      <button onClick={() => setStartMenuOpen((v) => !v)} className="flex items-center gap-1 rounded-md bg-[#16A34A] px-3 py-1.5 text-[12px] text-white" style={{ fontWeight: 700 }}>
                        <span className="material-icons" style={{ fontSize: "14px" }}>play_arrow</span> Start
                      </button>
                      {startMenuOpen && (
                        <div className="absolute right-0 top-9 z-10 w-36 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                          {(["enroute", "working", "done"] as Status[]).map((s) => (
                            <button key={s} onClick={() => { setStatus(s); setStartMenuOpen(false); }} className="block w-full px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">
                              {{ enroute: "En route", working: "Working", done: "Set to “Done”" }[s]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="rounded-md px-2.5 py-1 text-[11px] text-white" style={{ backgroundColor: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                  )
                }
              />
              <div className="flex border-b border-[#E5E7EB] px-1 text-[11px]">
                {(["general", "notes", "report"] as JobTab[]).map((t) => (
                  <button key={t} onClick={() => setJobTab(t)} className="px-2.5 py-2" style={{ color: jobTab === t ? "#4A6FA5" : "#8899AA", fontWeight: jobTab === t ? 700 : 500, borderBottom: jobTab === t ? "2px solid #4A6FA5" : "2px solid transparent" }}>
                    {{ general: "General", notes: "Notes", report: "Report Card" }[t]}
                  </button>
                ))}
              </div>

              {jobTab === "general" && (
                <div className="flex-1 space-y-3 overflow-y-auto p-3 text-[12px]">
                  <Field label="Customer" value="Johnson, Randy (12 Jobs)" link />
                  <Field label="Contact" value="Soto, Elvin" link />
                  <Field label="Start Date & Time" value="Oct 7, 2025, 9:09 AM" />
                  <Field label="Brief Description" value="AC not cooling" />
                  <Field label="Type" value={<span className="rounded bg-[#16A34A] px-1.5 py-0.5 text-[10px] text-white" style={{ fontWeight: 700 }}>Estimate</span>} />
                  <Field label="Work Address" value="5010 N Cortez Ave, Tampa, FL 33614" link />
                  <div>
                    <div className="mb-1 text-[#8899AA]">Media</div>
                    <div className="flex gap-2">
                      <button onClick={() => setScreen("media")} className="h-12 w-12 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F5F7FA] text-center text-[10px] text-[#546478]">📷</button>
                      <button onClick={() => setScreen("media")} className="h-12 w-12 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F5F7FA] text-center text-[10px] text-[#546478]">📷</button>
                      <button onClick={() => setAddPhotoMenuOpen((v) => !v)} className="relative flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-[#C8D5E8] text-[#4A6FA5]">
                        +
                        {addPhotoMenuOpen && (
                          <div className="absolute left-14 top-0 z-10 w-40 rounded-lg border border-[#E5E7EB] bg-white py-1 text-left shadow-lg">
                            {["Choose from gallery", "Use camera"].map((o) => (
                              <button key={o} onClick={() => { setAddPhotoMenuOpen(false); window.alert(`"${o}" — mock only, no camera in this demo.`); }} className="block w-full whitespace-nowrap px-3 py-2 text-left text-[12px] text-[#1A2332] hover:bg-[#F5F7FA]">{o}</button>
                            ))}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {jobTab === "notes" && (
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Detailed description (2)</div>
                    <div className="mt-1 text-[12px] text-[#546478]">AC system stopped working last night. AC age unknown. Customer wants to buy a new one.</div>
                    <div className="mt-1 text-[10px] text-[#8899AA]">Oct 26, 2025, 9:11 AM • Sarah Thompson</div>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Private Notes (1)</div>
                    <div className="mt-1 text-[12px] text-[#546478]">Client was very pleasant and inspect how during the service visit. Expressed interest in enrolling in a yearly maintenance plan.</div>
                  </div>
                </div>
              )}

              {jobTab === "report" && (
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {reportSections.map((sec, i) => (
                    <div key={sec.title} className="rounded-lg border border-[#E5E7EB]">
                      <button onClick={() => setOpenSection(openSection === i ? null : i)} className="flex w-full items-center justify-between px-3 py-2.5 text-left">
                        <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>{sec.title}</span>
                        <span className="material-icons text-[#8899AA]" style={{ fontSize: "16px", transform: openSection === i ? "rotate(180deg)" : "none" }}>expand_more</span>
                      </button>
                      {openSection === i && (
                        <div className="space-y-2 border-t border-[#EDF0F5] px-3 py-2">
                          {sec.fields.map(([k, v]) => (
                            <div key={k}>
                              <div className="text-[10px] text-[#8899AA]">{k}</div>
                              <div className="text-[12px] text-[#1A2332]">{v}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <BottomNav active="history" />
            </>
          )}

          {/* ---- Media viewer ---- */}
          {screen === "media" && (
            <>
              <Header title="Media" onBack={() => setScreen("job")} right={
                <div className="flex gap-1">
                  {["chat_bubble_outline", "edit", "download", "delete_outline"].map((ic) => (
                    <button key={ic} onClick={() => ic === "edit" && setScreen("imageDesc")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F5F7FA]">
                      <span className="material-icons text-[#546478]" style={{ fontSize: "16px" }}>{ic}</span>
                    </button>
                  ))}
                </div>
              } />
              <div className="flex flex-1 flex-col items-center justify-center bg-[#F5F7FA] p-4">
                <div className="flex h-52 w-52 items-center justify-center rounded-lg bg-[#E5E7EB] text-5xl">📷</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[#4A6FA5] px-1.5 py-0.5 text-[10px] text-white" style={{ fontWeight: 700 }}>After</span>
                  <span className="text-[12px] text-[#8899AA]">Image description goes here</span>
                </div>
                <div className="mt-1 text-[11px] text-[#9CA3AF]">1 / 2</div>
              </div>
              <BottomNav active="history" />
            </>
          )}

          {/* ---- Image description ---- */}
          {screen === "imageDesc" && (
            <>
              <Header title="Image description" onBack={() => setScreen("media")} />
              <div className="flex-1 space-y-4 p-4">
                <div>
                  <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Image type</div>
                  <div className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#1A2332]">After</div>
                </div>
                <div>
                  <div className="mb-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 700 }}>Image description</div>
                  <div className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#8899AA]">Image description goes here</div>
                </div>
              </div>
              <BottomNav active="history" />
            </>
          )}
        </div>
      </div>
      <div className="mt-4 max-w-[340px] text-center text-[11px] text-white/60">
        Quick click-through mockup for the Technician role — General, Notes, Report Card, statuses & media only (no pricing, no job close-out — matches R5/R6).
      </div>
    </div>
  );
}

function Field({ label, value, link }: { label: string; value: React.ReactNode; link?: boolean }) {
  return (
    <div>
      <div className="text-[#8899AA]">{label}</div>
      <div className={link ? "text-[#4A6FA5]" : "text-[#1A2332]"} style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
