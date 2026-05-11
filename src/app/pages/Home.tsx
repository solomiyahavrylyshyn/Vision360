import * as React from "react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Data ─────────────────────────────────────────────────────────────────────

const revenueExpensesData = [
  { month: "Jan", revenue: 8200,  expenses: 5800 },
  { month: "Feb", revenue: 14500, expenses: 7200 },
  { month: "Mar", revenue: 15800, expenses: 8100 },
  { month: "Apr", revenue: 19200, expenses: 13800 },
  { month: "May", revenue: 20500, expenses: 7600 },
  { month: "Jun", revenue: 25400, expenses: 13200 },
];

const revenueByClientData = [
  { name: "John Smith",    value: 29, color: "#4A6FA5" },
  { name: "Mike Davis",    value: 21, color: "#16A34A" },
  { name: "Sarah Johnson", value: 15, color: "#F97316" },
  { name: "Others",        value: 35, color: "#9CA3AF" },
];

const statCards = [
  {
    icon: "attach_money",
    iconBg: "#EBF0F8",
    iconColor: "#4A6FA5",
    label: "Total Revenue",
    value: "$109,800",
    change: "+18%",
    changeUp: true,
  },
  {
    icon: "receipt_long",
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
    label: "Total Expenses",
    value: "$61,300",
    change: "-12%",
    changeUp: false,
  },
  {
    icon: "trending_up",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    label: "Net Profit",
    value: "$48,500",
    change: "+24%",
    changeUp: true,
  },
  {
    icon: "schedule",
    iconBg: "#F3E8FF",
    iconColor: "#9333EA",
    label: "Profit Margin",
    value: "44.2%",
    change: "+5%",
    changeUp: true,
  },
];

const quickOverview = [
  { icon: "work",           iconBg: "#EBF0F8", iconColor: "#4A6FA5", label: "Jobs Completed",   value: "23",  change: "+15%", changeUp: true  },
  { icon: "pending_actions",iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Jobs In Progress",  value: "12",  change: "+9%",  changeUp: true  },
  { icon: "receipt",        iconBg: "#FEF2F2", iconColor: "#DC2626", label: "Invoices Overdue",  value: "8",   change: "+3",   changeUp: false },
  { icon: "people",         iconBg: "#F0F9FF", iconColor: "#0EA5E9", label: "Active Clients",    value: "156", change: "+8%",  changeUp: true  },
];

const DASH_TABS = ["All Business", "Sales Performance", "Financial Performance", "Reports"] as const;
type DashTab = typeof DASH_TABS[number];

const DATE_OPTIONS = ["This Month", "Last Month", "This Quarter", "This Year", "Custom Range"] as const;

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md px-3 py-2 text-[12px]">
      <div className="font-semibold text-[#1A2332] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: p.fill }} />
          <span className="text-[#546478]">{p.name}:</span>
          <span className="font-medium text-[#1A2332]">${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Home() {
  const [activeTab, setActiveTab] = useState<DashTab>("All Business");
  const [dateRange, setDateRange] = useState<string>("This Month");
  const [dateOpen, setDateOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<"Monthly" | "Weekly">("Monthly");

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 pt-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>
              Vision360 Business Insights
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Overview of your business performance</p>
          </div>

          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setDateOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#374151] hover:bg-[#F5F7FA] transition-colors"
              style={{ fontWeight: 500 }}
            >
              <span className="material-icons text-[#6B7280]" style={{ fontSize: "16px" }}>calendar_today</span>
              {dateRange}
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: "16px" }}>keyboard_arrow_down</span>
            </button>
            {dateOpen && (
              <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-1">
                {DATE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDateRange(opt); setDateOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[#F5F7FA] ${
                      dateRange === opt ? "text-[#4A6FA5] font-semibold" : "text-[#374151]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0">
          {DASH_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-[#4A6FA5] text-[#4A6FA5]"
                  : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
              style={{ fontWeight: activeTab === tab ? 600 : 500 }}
            >
              {tab}
            </button>
          ))}
          <button className="ml-2 w-7 h-7 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] rounded transition-colors">
            <span className="material-icons" style={{ fontSize: "18px" }}>edit</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-6 space-y-6">

        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: card.iconBg }}>
                  <span className="material-icons" style={{ fontSize: "20px", color: card.iconColor }}>{card.icon}</span>
                </div>
              </div>
              <div className="text-[26px] text-[#1A2332] leading-none mb-1.5" style={{ fontWeight: 700 }}>
                {card.value}
              </div>
              <div className="text-[13px] text-[#6B7280] mb-2">{card.label}</div>
              <div className={`flex items-center gap-1 text-[12px] ${card.changeUp ? "text-[#16A34A]" : "text-[#DC2626]"}`} style={{ fontWeight: 500 }}>
                <span className="material-icons" style={{ fontSize: "14px" }}>
                  {card.changeUp ? "arrow_upward" : "arrow_downward"}
                </span>
                {card.change}
                <span className="text-[#9CA3AF] font-normal ml-1">vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-[1fr_380px] gap-4">
          {/* Revenue vs Expenses */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Revenue vs Expenses</h2>
              <div className="relative">
                <select
                  value={chartPeriod}
                  onChange={e => setChartPeriod(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-1.5 border border-[#E5E7EB] rounded-lg text-[12px] text-[#374151] bg-white cursor-pointer focus:outline-none"
                  style={{ fontWeight: 500 }}
                >
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
                <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]" style={{ fontSize: "14px" }}>keyboard_arrow_down</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueExpensesData} barGap={4} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  tickFormatter={v => v === 0 ? "0" : `${v / 1000}K`}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F9FAFB" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#4A6FA5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 justify-center">
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                <span className="w-3 h-3 rounded-sm bg-[#4A6FA5]" />
                Revenue
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                <span className="w-3 h-3 rounded-sm bg-[#F97316]" />
                Expenses
              </div>
            </div>
          </div>

          {/* Revenue by Client */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
            <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue by Client</h2>
            <div className="flex items-center gap-4">
              {/* Legend list */}
              <div className="flex flex-col gap-3 flex-1">
                {revenueByClientData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: item.color }} />
                      <span className="text-[13px] text-[#374151]">{item.name}</span>
                    </div>
                    <span className="text-[13px] text-[#6B7280]" style={{ fontWeight: 500 }}>{item.value}%</span>
                  </div>
                ))}
              </div>
              {/* Donut */}
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByClientData}
                      cx="50%" cy="50%"
                      innerRadius={38} outerRadius={62}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                      strokeWidth={2}
                    >
                      {revenueByClientData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Quick Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            {quickOverview.map(item => (
              <div key={item.label} className="flex items-start gap-4 p-4 bg-[#F9FAFB] rounded-xl">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.iconBg }}>
                  <span className="material-icons" style={{ fontSize: "20px", color: item.iconColor }}>{item.icon}</span>
                </div>
                <div>
                  <div className="text-[24px] text-[#1A2332] leading-none mb-1" style={{ fontWeight: 700 }}>
                    {item.value}
                  </div>
                  <div className="text-[12px] text-[#6B7280] mb-1.5">{item.label}</div>
                  <div className={`flex items-center gap-0.5 text-[11px] ${item.changeUp ? "text-[#16A34A]" : "text-[#DC2626]"}`} style={{ fontWeight: 500 }}>
                    <span className="material-icons" style={{ fontSize: "12px" }}>
                      {item.changeUp ? "arrow_upward" : "arrow_downward"}
                    </span>
                    {item.change}
                    <span className="text-[#9CA3AF] font-normal ml-1">vs last period</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
