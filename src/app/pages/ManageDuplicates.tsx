import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "../components/ui/page-header";

interface DupClient {
  id: string;
  name: string;
  company: string;
  address: string;
  email: string;
  phone: string;
}

interface DupGroup {
  id: string;
  groupName: string;
  clients: DupClient[];
}

const initialGroups: DupGroup[] = [
  {
    id: "g1",
    groupName: "AND Services",
    clients: [
      { id: "g1-1", name: "And Services", company: "", address: "3248 W Colonial Dr\nOrlando, FL 32808", email: "", phone: "" },
      { id: "g1-2", name: "And Services", company: "", address: "5010 N Cortez Ave\nTampa, FL 33614", email: "", phone: "" },
      { id: "g1-3", name: "And Services", company: "", address: "1011 S Florida Ave\nInverness, FL 34450", email: "", phone: "" },
      { id: "g1-4", name: "AND Services", company: "", address: "5010 N Cortez Ave\nTampa, FL 33614", email: "cerb04@yahoo.com", phone: "(813) 263-0691" },
    ],
  },
  {
    id: "g2",
    groupName: "Gaby Huete",
    clients: [
      { id: "g2-1", name: "Gaby Huete", company: "", address: "4201 W Waters Ave\nTampa, FL 33614", email: "ghuete@email.com", phone: "(813) 555-1122" },
      { id: "g2-2", name: "Gabriela Huete", company: "", address: "4201 W Waters Ave\nTampa, FL 33614", email: "", phone: "(813) 555-1122" },
    ],
  },
  {
    id: "g3",
    groupName: "Janet Sorah",
    clients: [
      { id: "g3-1", name: "Janet Sorah", company: "", address: "7215 N Dale Mabry Hwy\nTampa, FL 33614", email: "jsorah@mail.com", phone: "" },
      { id: "g3-2", name: "Janet Sorah", company: "Sorah LLC", address: "", email: "jsorah@mail.com", phone: "(813) 444-9988" },
    ],
  },
  {
    id: "g4",
    groupName: "Marek Stroz",
    clients: [
      { id: "g4-1", name: "Marek Stroz", company: "", address: "13380 Tyringham St\nSpring Hill, FL 34609", email: "", phone: "" },
      { id: "g4-2", name: "Marek Stroz", company: "", address: "13380 Tyringham St\nSpring Hill, FL 34609", email: "mstroz@email.com", phone: "(352) 600-5511" },
    ],
  },
];

const matchOptions = ["Name", "Mobile Number", "Home Number", "Work Number", "Email"];

export function ManageDuplicates() {
  const navigate = useNavigate();
  const [matchOn, setMatchOn] = useState("Name");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["g1"]));
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [groups, setGroups] = useState<DupGroup[]>(initialGroups);

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups);
    next.has(groupId) ? next.delete(groupId) : next.add(groupId);
    setExpandedGroups(next);
  };

  const toggleClient = (clientId: string) => {
    const next = new Set(selectedClients);
    next.has(clientId) ? next.delete(clientId) : next.add(clientId);
    setSelectedClients(next);
  };

  const handleMerge = () => {
    if (selectedClients.size < 2) return;
    // Remove selected (except first) from groups
    const toRemove = new Set(selectedClients);
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        clients: g.clients.filter((c, idx) => {
          if (!toRemove.has(c.id)) return true;
          // keep first selected per group
          const firstSelected = g.clients.find(cl => toRemove.has(cl.id));
          return firstSelected?.id === c.id;
        }),
      })).filter(g => g.clients.length > 1)
    );
    setSelectedClients(new Set());
  };

  const totalResults = groups.length;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[#546478] mb-5">
        <button
          onClick={() => navigate("/clients")}
          className="hover:text-[#4A6FA5] transition-colors"
          style={{ fontWeight: 500 }}
        >
          Clients
        </button>
        <span className="material-icons text-[#C5CEDD]" style={{ fontSize: "16px" }}>chevron_right</span>
        <span className="text-[#1A2332]" style={{ fontWeight: 500 }}>Manage duplicates</span>
      </div>

      {/* Page header */}
      <PageHeader
        title="Manage duplicates"
        subtitle={
          <p className="text-[14px] text-[#546478] mt-1 font-normal" style={{ fontWeight: 400 }}>
            We've grouped possible duplicate client profiles below.
          </p>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Match on dropdown */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-[#9AA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>
              Match customers on
            </span>
            <div className="relative">
              <select
                value={matchOn}
                onChange={e => setMatchOn(e.target.value)}
                className="h-9 pl-3 pr-8 border border-[#D1D5DB] rounded-md text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] appearance-none cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {matchOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#9AA3AF] pointer-events-none" style={{ fontSize: "16px" }}>
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Merge button — shows when items selected */}
        {selectedClients.size >= 2 && (
          <button
            onClick={handleMerge}
            className="h-9 px-5 border border-[#4A6FA5] rounded-full text-[13px] text-[#4A6FA5] hover:bg-[#EEF3FA] transition-colors"
            style={{ fontWeight: 500 }}
          >
            Merge
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_180px_200px_220px_200px_180px] bg-[#F5F7FA] border-b border-[#DDE3EE]">
          <div className="px-4 py-3" />
          <div className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Customer</div>
          <div className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Company</div>
          <div className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Address</div>
          <div className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Email</div>
          <div className="px-4 py-3 text-[11px] uppercase tracking-wide text-[#546478]" style={{ fontWeight: 600 }}>Phone</div>
        </div>

        {groups.map(group => (
          <div key={group.id} className="border-b border-[#DDE3EE] last:border-0">
            {/* Group header row */}
            <div
              className="grid grid-cols-[40px_180px_200px_220px_200px_180px] items-center hover:bg-[#F9FAFB] cursor-pointer"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="px-4 py-3.5 flex items-center justify-center">
                <span
                  className={`material-icons text-[#546478] transition-transform ${expandedGroups.has(group.id) ? "rotate-180" : ""}`}
                  style={{ fontSize: "18px" }}
                >
                  expand_more
                </span>
              </div>
              <div className="px-4 py-3.5 text-[14px] text-[#1A2332]" style={{ fontWeight: 600 }}>
                {group.groupName}
              </div>
              <div className="px-4 py-3.5 col-span-4 text-[12px] text-[#9AA3AF]">
                {group.clients.length} possible duplicates
              </div>
            </div>

            {/* Expanded client rows */}
            {expandedGroups.has(group.id) && group.clients.map(client => (
              <div
                key={client.id}
                className={`grid grid-cols-[40px_180px_200px_220px_200px_180px] items-start border-t border-[#F0F2F5] transition-colors ${
                  selectedClients.has(client.id) ? "bg-[#EDF5FF]" : "hover:bg-[#F9FAFB]"
                }`}
                onClick={() => toggleClient(client.id)}
              >
                <div className="px-4 py-3.5 flex items-center justify-center pt-4">
                  <input
                    type="checkbox"
                    checked={selectedClients.has(client.id)}
                    onChange={e => { e.stopPropagation(); toggleClient(client.id); }}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-[#D1D5DB] accent-[#4A6FA5] cursor-pointer"
                  />
                </div>
                <div className="px-4 py-3.5 text-[14px] text-[#1A2332]">{client.name}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.company || ""}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478] whitespace-pre-line">{client.address}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.email}</div>
                <div className="px-4 py-3.5 text-[14px] text-[#546478]">{client.phone}</div>
              </div>
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="py-16 text-center">
            <span className="material-icons text-[#DDE3EE] mb-3 block" style={{ fontSize: "48px" }}>check_circle</span>
            <p className="text-[15px] text-[#546478]" style={{ fontWeight: 500 }}>No duplicates found</p>
            <p className="text-[13px] text-[#9AA3AF] mt-1">All client profiles appear to be unique.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-4">
        <div className="flex items-center gap-2 text-[13px] text-[#546478]">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="h-8 px-2 border border-[#DDE3EE] rounded text-[13px] text-[#374151] bg-white focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <span className="text-[13px] text-[#546478]">1–{Math.min(rowsPerPage, totalResults)} of {totalResults}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled>
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_left</span>
          </button>
          <button className="p-1 text-[#546478] hover:bg-[#EDF0F5] rounded disabled:opacity-40" disabled>
            <span className="material-icons" style={{ fontSize: "20px" }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
