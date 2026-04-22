import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";

const todaysJobs = [
  {
    id: 1,
    time: "8:00 AM",
    endTime: "9:30 AM",
    client: "Sarah Johnson",
    service: "HVAC Inspection",
    address: "123 Oak Street, Boston, MA 02101",
    notes: "Annual maintenance. Dog in backyard — use side gate.",
    status: "In Progress" as const,
    assignee: "Marek Stroz",
  },
  {
    id: 2,
    time: "10:00 AM",
    endTime: "11:30 AM",
    client: "Michael Chen",
    service: "Plumbing Repair",
    address: "456 Maple Ave, Cambridge, MA 02139",
    notes: "Kitchen sink leak. Customer prefers text before arrival.",
    status: "Scheduled" as const,
    assignee: "Marek Stroz",
  },
  {
    id: 3,
    time: "12:30 PM",
    endTime: "2:00 PM",
    client: "Emily Rodriguez",
    service: "Water Heater Installation",
    address: "789 Pine Rd, Somerville, MA 02143",
    notes: "New 50-gal tank. Old unit in basement. Parking in driveway.",
    status: "Scheduled" as const,
    assignee: "Marek Stroz",
  },
  {
    id: 4,
    time: "2:30 PM",
    endTime: "3:30 PM",
    client: "David Park",
    service: "Electrical Panel Upgrade",
    address: "321 Elm Blvd, Newton, MA 02458",
    notes: "Upgrade from 100A to 200A panel. Permit on file.",
    status: "Scheduled" as const,
    assignee: "John Smith",
  },
  {
    id: 5,
    time: "4:00 PM",
    endTime: "5:00 PM",
    client: "Lisa Thompson",
    service: "AC Tune-Up",
    address: "654 Birch Ln, Brookline, MA 02445",
    notes: "Seasonal check. Unit on rooftop — bring ladder.",
    status: "Scheduled" as const,
    assignee: "Marek Stroz",
  },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "Scheduled": { bg: "bg-[#EBF2FC]", text: "text-[#4A6FA5]", dot: "bg-[#4A6FA5]" },
  "In Progress": { bg: "bg-[#FEF9E7]", text: "text-[#92710C]", dot: "bg-[#D4A017]" },
  "Completed": { bg: "bg-[#E9F7EF]", text: "text-[#1E7A45]", dot: "bg-[#22C55E]" },
  "Cancelled": { bg: "bg-[#FEF2F2]", text: "text-[#991B1B]", dot: "bg-[#EF4444]" },
};

export function Dashboard() {
  const navigate = useNavigate();

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const jobCount = todaysJobs.length;
  const inProgressCount = todaysJobs.filter(j => j.status === "In Progress").length;

  return (
    <div className="p-6 bg-[#F5F7FA] min-h-full">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>
          Good morning, Marek
        </h1>
        <p className="text-[14px] text-[#546478]">{dateStr}</p>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332" }}>{jobCount}</div>
              <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>Jobs Today</div>
              {inProgressCount > 0 && (
                <div className="text-[11px] text-[#546478]">{inProgressCount} in progress</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332", fontVariantNumeric: "tabular-nums" }}>$3,480</div>
              <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>Outstanding Invoices</div>
              <div className="text-[11px] text-[#546478]">4 unpaid</div>
            </div>
          </div>
        </Card>

        <Card className="px-4 py-3 border border-[#DDE3EE] bg-white hover:shadow-sm transition-shadow h-[110.5px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[24px] mb-0.5 leading-none" style={{ fontWeight: 700, color: "#1A2332", fontVariantNumeric: "tabular-nums" }}>$6,240</div>
              <div className="text-[12px] mb-0.5" style={{ fontWeight: 500, color: "#546478" }}>This Week's Earnings</div>
              <div className="text-[11px] text-[#546478]">vs last week</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                  <span className="material-icons leading-none" style={{ fontSize: "14px" }}>trending_up</span>+12%
                </span>
                <span className="text-[11px] text-[#546478]">vs last week</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>Today's Schedule</h2>
        <button
          onClick={() => navigate("/calendar")}
          className="text-[13px] text-[#4A6FA5] hover:underline flex items-center gap-1"
          style={{ fontWeight: 500 }}
        >
          View full calendar
          <span className="material-icons" style={{ fontSize: "16px" }}>arrow_forward</span>
        </button>
      </div>

      {/* Job Cards */}
      <div className="flex flex-col gap-3">
        {todaysJobs.map((job) => {
          const st = statusConfig[job.status];
          return (
            <button
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="bg-white border border-[#DDE3EE] rounded-lg p-5 text-left hover:border-[#4A6FA5]/40 hover:shadow-[0_2px_8px_rgba(74,111,165,0.08)] transition-all group w-full"
            >
              <div className="flex items-start gap-5">
                {/* Time block */}
                <div className="flex-shrink-0 w-[90px] text-center pt-0.5">
                  <div className="text-[15px] text-[#1A2332]" style={{ fontWeight: 700 }}>{job.time}</div>
                  <div className="text-[11px] text-[#8899AA] mt-0.5">to {job.endTime}</div>
                </div>

                {/* Divider */}
                <div className="w-px h-[72px] bg-[#DDE3EE] flex-shrink-0 self-center"></div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>{job.client}</span>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${st.bg}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></div>
                      <span className={`text-[11px] ${st.text}`} style={{ fontWeight: 600 }}>{job.status}</span>
                    </div>
                  </div>
                  <div className="text-[13px] text-[#4A6FA5] mb-1" style={{ fontWeight: 500 }}>{job.service}</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#546478] mb-2">
                    <span className="material-icons" style={{ fontSize: "14px" }}>location_on</span>
                    {job.address}
                  </div>
                  <div className="flex items-start gap-1.5 text-[12px] text-[#8899AA]">
                    <span className="material-icons flex-shrink-0 mt-px" style={{ fontSize: "14px" }}>sticky_note_2</span>
                    <span>{job.notes}</span>
                  </div>
                </div>

                {/* Assignee + Arrow */}
                <div className="flex-shrink-0 flex flex-col items-end gap-3 pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#4A6FA5] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>
                      {job.assignee.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[12px] text-[#546478]">{job.assignee}</span>
                  </div>
                  <span className="material-icons text-[#C8D5E8] group-hover:text-[#4A6FA5] transition-colors" style={{ fontSize: "20px" }}>chevron_right</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
