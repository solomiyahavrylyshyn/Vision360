import { useState } from "react";

interface DialerProps {
  isOpen: boolean;
  onClose: () => void;
}

const keys: { digit: string; letters: string }[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

const mockRecents = [
  { name: "John Doe", number: "(555) 123-4567", time: "2 min ago", type: "outgoing" },
  { name: "Sarah Williams", number: "(555) 234-5678", time: "15 min ago", type: "incoming" },
  { name: "Travis Jones", number: "(555) 345-6789", time: "1 hr ago", type: "missed" },
  { name: "Mike Rodriguez", number: "(555) 456-7890", time: "3 hrs ago", type: "outgoing" },
];

const mockContacts = [
  { name: "Alex Turner", number: "(555) 111-2222" },
  { name: "John Doe", number: "(555) 123-4567" },
  { name: "Mike Rodriguez", number: "(555) 456-7890" },
  { name: "Sarah Williams", number: "(555) 234-5678" },
  { name: "Travis Jones", number: "(555) 345-6789" },
];

type Tab = "Recents" | "Contacts" | "Keypad";

export function Dialer({ isOpen, onClose }: DialerProps) {
  const [tab, setTab] = useState<Tab>("Keypad");
  const [value, setValue] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  if (!isOpen) return null;

  const press = (key: string) => {
    if (value.length >= 15) return;
    setValue(value + key);
  };

  const backspace = () => setValue(value.slice(0, -1));

  const filteredContacts = mockContacts.filter(c =>
    contactSearch ? c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.number.includes(contactSearch) : true
  );

  const recentIcon = (type: string) => {
    if (type === "incoming") return { icon: "call_received", color: "#22C55E" };
    if (type === "missed") return { icon: "call_missed", color: "#EF4444" };
    return { icon: "call_made", color: "#4A6FA5" };
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[3000]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] bg-white border border-[#DDE3EE] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.18)] z-[3002] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDE3EE]">
          <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Dialer</span>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-[#F5F7FA] flex items-center justify-center">
            <span className="material-icons text-[#546478]" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#DDE3EE]">
          {(["Recents", "Contacts", "Keypad"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[13px] border-b-2 transition-all ${
                tab === t ? "text-[#4A6FA5] border-[#4A6FA5]" : "text-[#546478] border-transparent hover:bg-[#F9FAFB]"
              }`}
              style={{ fontWeight: tab === t ? 600 : 500 }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "Keypad" && (
          <>
            {/* Display */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 min-h-[56px]">
              <div
                className={`flex-1 flex items-center min-h-[32px] ${
                  value ? "text-[22px] text-[#1A2332] tracking-[2px]" : "text-[14px] text-[#546478]"
                }`}
                style={{ fontWeight: value ? 300 : 400, letterSpacing: value ? "2px" : "0" }}
              >
                {value || "Enter number"}
              </div>
              <button
                onClick={backspace}
                className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F7FA] transition-all ${value ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <span className="material-icons text-[#546478]" style={{ fontSize: "20px" }}>backspace</span>
              </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-1 px-4 pb-3">
              {keys.map(k => (
                <button
                  key={k.digit}
                  onClick={() => press(k.digit)}
                  className="flex flex-col items-center justify-center h-[52px] rounded-[10px] hover:bg-[#F5F7FA] active:bg-[#EDF0F5] transition-colors select-none"
                >
                  <span className="text-[20px] text-[#1A2332]" style={{ fontWeight: 400, lineHeight: 1 }}>{k.digit}</span>
                  <span className="text-[9px] text-[#546478] tracking-[0.08em] mt-0.5 h-[11px]" style={{ fontWeight: 600 }}>{k.letters || "\u00A0"}</span>
                </button>
              ))}
            </div>

            {/* Call button */}
            <div className="flex justify-center pb-5 pt-1">
              <button className="w-[60px] h-[60px] bg-[#16A34A] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(22,163,74,0.35)] hover:bg-[#15803D] hover:shadow-[0_6px_16px_rgba(22,163,74,0.45)] hover:scale-105 transition-all">
                <span className="material-icons" style={{ fontSize: "26px" }}>call</span>
              </button>
            </div>
          </>
        )}

        {tab === "Recents" && (
          <div className="max-h-[380px] overflow-y-auto">
            {mockRecents.map((r, idx) => {
              const ri = recentIcon(r.type);
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] cursor-pointer border-b border-[#EDF0F5] last:border-0">
                  <div className="w-9 h-9 rounded-full bg-[#EBF0F8] flex items-center justify-center flex-shrink-0">
                    <span className="material-icons" style={{ fontSize: "16px", color: ri.color }}>{ri.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{r.name}</div>
                    <div className="text-[12px] text-[#8899AA]">{r.number}</div>
                  </div>
                  <div className="text-[11px] text-[#8899AA] flex-shrink-0">{r.time}</div>
                  <button className="w-7 h-7 rounded-md hover:bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
                    <span className="material-icons text-[#16A34A]" style={{ fontSize: "16px" }}>call</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "Contacts" && (
          <div className="flex flex-col">
            <div className="p-3 border-b border-[#DDE3EE]">
              <div className="relative">
                <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: "16px" }}>search</span>
                <input
                  type="text" placeholder="Search contacts..." value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 border border-[#DDE3EE] rounded-lg text-[13px] focus:outline-none focus:border-[#4A6FA5]"
                />
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {filteredContacts.map((c, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] cursor-pointer border-b border-[#EDF0F5] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[11px] flex-shrink-0" style={{ fontWeight: 600 }}>
                    {c.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="text-[12px] text-[#8899AA]">{c.number}</div>
                  </div>
                  <button className="w-7 h-7 rounded-md hover:bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
                    <span className="material-icons text-[#16A34A]" style={{ fontSize: "16px" }}>call</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
