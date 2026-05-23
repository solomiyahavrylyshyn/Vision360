import * as React from "react";
import { useState, useSyncExternalStore } from "react";
import { companyStore } from "../stores/companyStore";
import { ColumnSettingsIcon } from "../components/ui/column-settings-icon";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
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

const salesData = [
  { month: "Jan", estimates: 12, converted: 8,  revenue: 8200  },
  { month: "Feb", estimates: 18, converted: 13, revenue: 14500 },
  { month: "Mar", estimates: 21, converted: 16, revenue: 15800 },
  { month: "Apr", estimates: 25, converted: 19, revenue: 19200 },
  { month: "May", estimates: 22, converted: 17, revenue: 20500 },
  { month: "Jun", estimates: 30, converted: 24, revenue: 25400 },
];

const topClientsData = [
  { name: "Travis Jones",   jobs: 8, revenue: 18400, change: "+12%" },
  { name: "Sarah Williams", jobs: 6, revenue: 14200, change: "+8%"  },
  { name: "John Doe",       jobs: 5, revenue: 11600, change: "+22%" },
  { name: "Mike Rodriguez", jobs: 4, revenue: 9800,  change: "-3%"  },
  { name: "Alex Turner",    jobs: 3, revenue: 7200,  change: "+5%"  },
];

const invoiceStatusData = [
  { status: "Paid",          amount: 13193, count: 3, color: "#16A34A" },
  { status: "Unpaid",        amount: 3413,  count: 3, color: "#4A6FA5" },
  { status: "Overdue",       amount: 5975,  count: 1, color: "#DC2626" },
  { status: "Not Deposited", amount: 2365,  count: 1, color: "#D97706" },
];

const cashFlowData = [
  { month: "Jan", inflow: 8200,  outflow: 5800,  net: 2400  },
  { month: "Feb", inflow: 14500, outflow: 7200,  net: 7300  },
  { month: "Mar", inflow: 15800, outflow: 8100,  net: 7700  },
  { month: "Apr", inflow: 19200, outflow: 13800, net: 5400  },
  { month: "May", inflow: 20500, outflow: 7600,  net: 12900 },
  { month: "Jun", inflow: 25400, outflow: 13200, net: 12200 },
];

const expensesByCategoryData = [
  { category: "Materials", amount: 24500, pct: 40, color: "#4A6FA5" },
  { category: "Labor",     amount: 18375, pct: 30, color: "#16A34A" },
  { category: "Equipment", amount: 9188,  pct: 15, color: "#F97316" },
  { category: "Travel",    amount: 4594,  pct: 7.5, color: "#9333EA" },
  { category: "Other",     amount: 4643,  pct: 7.5, color: "#9CA3AF" },
];

const allStatCards = [
  { icon: "payments",        iconBg: "rgba(22,163,74,0.15)",   iconColor: "#16A34A", label: "Total Revenue",  value: "$109,800", change: "+18%", changeUp: true  },
  { icon: "receipt_long",    iconBg: "rgba(245,158,11,0.15)",  iconColor: "#F59E0B", label: "Total Expenses", value: "$61,300",  change: "-12%", changeUp: false },
  { icon: "monetization_on", iconBg: "rgba(74,111,165,0.15)",  iconColor: "#4A6FA5", label: "Net Profit",     value: "$48,500",  change: "+24%", changeUp: true  },
  { icon: "pie_chart",       iconBg: "rgba(168,86,247,0.15)",  iconColor: "#A856F7", label: "Profit Margin",  value: "44.2%",    change: "+5%",  changeUp: true  },
];

const quickOverview = [
  { icon: "work",            iconBg: "rgba(74,111,165,0.15)",  iconColor: "#4A6FA5", label: "Jobs Completed",  value: "23",  change: "+15%", changeUp: true  },
  { icon: "pending_actions", iconBg: "rgba(22,163,74,0.15)",   iconColor: "#16A34A", label: "Jobs In Progress", value: "12",  change: "+9%",  changeUp: true  },
  { icon: "receipt",         iconBg: "rgba(220,38,38,0.15)",   iconColor: "#DC2626", label: "Invoices Overdue", value: "8",   change: "+3",   changeUp: false },
  { icon: "people",          iconBg: "rgba(129,180,243,0.15)", iconColor: "#81B4F3", label: "Active Clients",   value: "156", change: "+8%",  changeUp: true  },
];

const ALL_TABS = ["All Business", "Sales Performance", "Financial Performance", "Reports"] as const;
type DashTab = typeof ALL_TABS[number];

const DATE_OPTIONS = ["This Month", "Last Month", "This Quarter", "This Year", "Custom Range"] as const;

// ── Tooltips ──────────────────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md px-3 py-2 text-[12px]">
      <div className="font-semibold text-[#1A2332] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: p.fill || p.stroke }} />
          <span className="text-[#546478]">{p.name}:</span>
          <span className="font-medium text-[#1A2332]">{typeof p.value === "number" && p.value > 100 ? `$${p.value.toLocaleString()}` : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Shared mini-card ──────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, iconColor, label, value, change, changeUp }: typeof allStatCards[0]) {
  const description = `${label}: ${value}, ${changeUp ? "up" : "down"} ${change} vs last period`;

  return (
    <div
      className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
      style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
      aria-label={description}
      title={description}
    >
      <div className="flex min-w-0 flex-col justify-center">
        <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700 }}>{value}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#546478]">{label}</div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
        <span className="material-icons" style={{ fontSize: "18px", color: iconColor }}>{icon}</span>
      </div>
    </div>
  );
}

// ── Tab Content Components ────────────────────────────────────────────────────

function AllBusinessTab() {
  const [chartPeriod, setChartPeriod] = useState<"Monthly" | "Weekly">("Monthly");
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {allStatCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[1fr_360px] gap-4">
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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueExpensesData} barGap={4} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={v => v === 0 ? "0" : `${v / 1000}K`} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F9FAFB" }} />
              <Bar dataKey="revenue" name="Revenue" fill="#4A6FA5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#4A6FA5]" />Revenue</div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#F97316]" />Expenses</div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue by Client</h2>
          <div className="flex items-center gap-4">
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
            <div className="w-[130px] h-[130px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByClientData} cx="50%" cy="50%" innerRadius={34} outerRadius={58} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={2}>
                    {revenueByClientData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview — single unified bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl flex items-center py-4" style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
        {quickOverview.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-start gap-2 flex-1 ${i > 0 ? "border-l border-[#E5E7EB]" : ""}`}
            style={{ padding: "0px 24px 0px 16px", height: "80px" }}
          >
            <div className="flex flex-col gap-1 flex-1 justify-center h-full">
              <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>{item.value}</div>
              <div className="text-[16px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "24px" }}>{item.label}</div>
              <div className={`flex items-center gap-1 text-[12px] ${item.changeUp ? "text-[#16A34A]" : "text-[#DC2626]"}`} style={{ fontWeight: 400, lineHeight: "16px" }}>
                <span className="material-icons" style={{ fontSize: "14px" }}>{item.changeUp ? "trending_up" : "trending_down"}</span>
                {item.change}
                <span className="text-[#6B7280] font-normal ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-1" style={{ background: item.iconBg }}>
              <span className="material-icons" style={{ fontSize: "24px", color: item.iconColor }}>{item.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesPerformanceTab() {
  const [salesPeriod, setSalesPeriod] = useState<"Monthly" | "Weekly" | "Quarterly">("Monthly");

  return (
    <div className="space-y-6">
      {/* ── KPI row (per Figma) ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: "schedule",     iconBg: "rgba(74,111,165,0.15)",  iconColor: "#4A6FA5", label: "Estimates sent",  value: "128",   change: "+14%", changeUp: true  },
          { icon: "percent",      iconBg: "rgba(22,163,74,0.15)",   iconColor: "#16A34A", label: "Conversion rate", value: "76.6%", change: "+5%",  changeUp: true  },
          { icon: "work",         iconBg: "rgba(245,158,11,0.15)",  iconColor: "#F59E0B", label: "Jobs won",        value: "98",    change: "-12%", changeUp: false },
          { icon: "people",       iconBg: "rgba(129,180,243,0.15)", iconColor: "#81B4F3", label: "New clients",     value: "24",    change: "+9%",  changeUp: true  },
        ].map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Charts row (per Figma: 722/430 ratio) ─────────────── */}
      <div className="grid grid-cols-[1fr_430px] gap-4">
        {/* Estimates vs jobs won */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "24px" }}>Estimates vs jobs won</h2>
            <div className="relative">
              <select
                value={salesPeriod}
                onChange={e => setSalesPeriod(e.target.value as any)}
                className="appearance-none pl-3 pr-8 h-9 border border-[#E5E7EB] rounded-lg text-[14px] text-[#1A2332] bg-white cursor-pointer focus:outline-none"
                style={{ fontWeight: 400, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
              >
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Quarterly</option>
              </select>
              <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7280]" style={{ fontSize: "16px" }}>keyboard_arrow_down</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={194}>
            <BarChart data={salesData} barGap={4} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F9FAFB" }} />
              <Bar dataKey="estimates" name="Estimates" fill="#4A6FA5" radius={[2, 2, 0, 0]} />
              <Bar dataKey="converted" name="Jobs won" fill="#F59E0B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1 text-[12px] text-[#1A2332]"><span className="w-2 h-2 rounded-sm bg-[#4A6FA5]" />Estimates</div>
            <div className="flex items-center gap-1 text-[12px] text-[#1A2332]"><span className="w-2 h-2 rounded-sm bg-[#F59E0B]" />Jobs won</div>
          </div>
        </div>

        {/* Revenue trend */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <h2 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 600, lineHeight: "24px" }}>Revenue trend</h2>
          <ResponsiveContainer width="100%" height={222}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#4A6FA5" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4A6FA5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={v => v === 0 ? "0K" : `${v / 1000}K`} />
              <Tooltip content={<CustomBarTooltip />} />
              <Area dataKey="revenue" name="Revenue" stroke="#4A6FA5" strokeWidth={1} fill="url(#salesGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top clients by revenue (per Figma) ────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-4 py-3.5 flex items-center">
          <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "24px" }}>Top clients by revenue</h2>
        </div>
        <div className="border-t border-[#E5E7EB]">
          {/* Column header */}
          <div className="grid grid-cols-4 px-2 h-10 items-center bg-[#F5F7FA] border-b border-[#E5E7EB]">
            <div className="px-2 text-[14px] text-[#1A2332]" style={{ fontWeight: 500 }}>Client</div>
            <div className="px-2 text-[14px] text-[#1A2332] text-right" style={{ fontWeight: 500 }}>Jobs</div>
            <div className="px-2 text-[14px] text-[#1A2332] text-right" style={{ fontWeight: 500 }}>Revenue</div>
            <div className="px-2 text-[14px] text-[#1A2332] text-right" style={{ fontWeight: 500 }}>Vs last period</div>
          </div>
          {/* Rows */}
          {topClientsData.map((c) => (
            <div key={c.name} className="grid grid-cols-4 px-2 h-[60px] items-center border-b border-[#E5E7EB] bg-white last:border-b-0">
              <div className="px-2 text-[14px] text-[#1A2332]" style={{ fontWeight: 400 }}>{c.name}</div>
              <div className="px-2 text-[14px] text-[#6B7280] text-right" style={{ fontWeight: 400 }}>{c.jobs}</div>
              <div className="px-2 text-[14px] text-[#1A2332] text-right" style={{ fontWeight: 400 }}>${c.revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(",", ".")}</div>
              <div className="px-2 text-[14px] text-right" style={{ fontWeight: 400, color: c.change.startsWith("+") ? "#16A34A" : "#DC2626" }}>{c.change}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinancialPerformanceTab() {
  // Invoice status with Figma colors and percentages
  const invoiceStatus = [
    { label: "Paid",          count: 8, pct: 29, color: "#16A34A" },
    { label: "Unpaid",        count: 3, pct: 21, color: "#4A6FA5" },
    { label: "Overdue",       count: 5, pct: 15, color: "#DC2626" },
    { label: "Not deposited", count: 4, pct: 25, color: "#F59E0B" },
  ];
  // Expenses by category with Figma colors
  const expenseCats = [
    { label: "Materials", pct: 40,  color: "#4A6FA5" },
    { label: "Labor",     pct: 30,  color: "#16A34A" },
    { label: "Equipment", pct: 15,  color: "#F59E0B" },
    { label: "Travel",    pct: 7.5, color: "#A856F7" },
    { label: "Other",     pct: 7.5, color: "#F0F4FB" },
  ];

  return (
    <div className="space-y-6">
      {/* ── KPI row (per Figma) ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: "account_balance_wallet", iconBg: "rgba(22,163,74,0.15)",  iconColor: "#16A34A", label: "Total collected", value: "$14,628", change: "+11%", changeUp: true  },
          { icon: "star_border",            iconBg: "rgba(74,111,165,0.15)", iconColor: "#4A6FA5", label: "Outstanding",     value: "$9,389",  change: "+2%",  changeUp: false },
          { icon: "trending_down",          iconBg: "rgba(245,158,11,0.15)", iconColor: "#F59E0B", label: "Total expenses",  value: "$61,300", change: "-12%", changeUp: false },
          { icon: "savings",                iconBg: "rgba(107,114,128,0.15)",iconColor: "#6B7280", label: "Net cash flow",   value: "$47,900", change: "+31%", changeUp: true  },
        ].map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Revenue trend (full-width, inflow/outflow area chart) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
        <h2 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 600, lineHeight: "24px" }}>Revenue trend</h2>
        <ResponsiveContainer width="100%" height={194}>
          <AreaChart data={cashFlowData}>
            <defs>
              <linearGradient id="finInflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#16A34A" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="finOutflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#DC2626" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={v => v === 0 ? "0K" : `${v / 1000}K`} />
            <Tooltip content={<CustomBarTooltip />} />
            <Area dataKey="inflow"  name="Inflow"  stroke="#16A34A" strokeWidth={1} fill="url(#finInflow)"  dot={false} />
            <Area dataKey="outflow" name="Outflow" stroke="#DC2626" strokeWidth={1} fill="url(#finOutflow)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1 text-[12px] text-[#1A2332]"><span className="w-2 h-2 rounded-sm bg-[#16A34A]" />Inflow</div>
          <div className="flex items-center gap-1 text-[12px] text-[#1A2332]"><span className="w-2 h-2 rounded-sm bg-[#DC2626]" />Outflow</div>
        </div>
      </div>

      {/* ── Invoice status + Expenses by category (per Figma 430/722) ── */}
      <div className="grid grid-cols-[430px_1fr] gap-4">
        {/* Invoice status */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <h2 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 600, lineHeight: "24px" }}>Invoice status</h2>
          <div className="flex items-center justify-center gap-8 h-[206px]">
            {/* Donut */}
            <div className="w-[150px] h-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatus}
                    cx="50%" cy="50%"
                    innerRadius={0}
                    outerRadius={75}
                    dataKey="pct"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    {invoiceStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend list */}
            <div className="flex flex-col justify-center gap-1">
              {invoiceStatus.map(item => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ width: 176, height: 32 }}>
                  <span className="rounded-sm shrink-0" style={{ width: 10, height: 10, background: item.color }} />
                  <span className="flex-1 text-[12px] text-[#1A2332]" style={{ fontWeight: 400, lineHeight: "16px" }}>
                    {item.label} ({item.count})
                  </span>
                  <span className="text-[12px] text-[#1A2332]" style={{ fontWeight: 700, lineHeight: "16px" }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses by category */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
          <h2 className="text-[16px] text-[#1A2332] mb-3" style={{ fontWeight: 600, lineHeight: "24px" }}>Expenses by category</h2>
          <div className="flex items-center gap-3" style={{ height: 206 }}>
            {/* Labels column */}
            <div className="flex flex-col" style={{ gap: 27, width: 60 }}>
              {expenseCats.map(c => (
                <div key={c.label} className="text-[12px] text-[#6B7280] text-right" style={{ fontWeight: 400, lineHeight: "16px", height: 16 }}>{c.label}</div>
              ))}
            </div>
            {/* Bars column */}
            <div className="flex-1 flex flex-col" style={{ gap: 9 }}>
              {expenseCats.map(c => (
                <div key={c.label} style={{ height: 34, width: `${c.pct * 2.4}%`, minWidth: 40, background: c.color, borderRadius: 4 }} />
              ))}
            </div>
            {/* Percentages column */}
            <div className="flex flex-col" style={{ gap: 27, width: 54 }}>
              {expenseCats.map(c => (
                <div key={c.label} className="text-[12px] text-[#6B7280] text-right" style={{ fontWeight: 400, lineHeight: "16px", height: 16 }}>{c.pct}%</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerateReportForm({ onCancel }: { onCancel: () => void }) {
  const reportTypes = ["Revenue Report", "Profit & Loss Statement", "Jobs Report", "Job Costing Summary", "Invoice Summary", "Expense Report", "Client Report", "Team Report", "Sales Tax Report", "Items Report", "Payments Report", "Estimates Report", "Estimate Conversion Report", "Revenue by Technician"];
  const categories = ["Financial / Business", "Jobs", "Clients / Team / Items", "Estimates"];
  const groupByOptions = ["Date", "Client", "Technician", "Service", "Job Type"];
  const sortByOptions = ["Date (Newest → Oldest)", "Date (Oldest → Newest)", "Amount (High → Low)", "Amount (Low → High)"];
  const quickFilters = ["This Month", "Last Month", "This Quarter", "Last Quarter", "Year to Date", "Custom"];

  const [reportType, setReportType] = useState("Revenue Report");
  const [category, setCategory] = useState("Financial / Business");
  const [reportName, setReportName] = useState("Revenue Report - May 2025");
  const [activeQuickFilter, setActiveQuickFilter] = useState("This Month");
  const [outputFormat, setOutputFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummaryOnly, setIncludeSummaryOnly] = useState(false);
  const [groupBy, setGroupBy] = useState("Date");
  const [sortBy, setSortBy] = useState("Date (Newest → Oldest)");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${value ? "bg-[#4A6FA5]" : "bg-[#D1D5DB]"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );

  const SelectField = ({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label?: string }) => (
    <div className="relative w-full">
      {label && <div className="mb-1 text-[12px] text-[#6B7280] font-medium">{label}</div>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none h-9 pl-3 pr-8 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1A2332] bg-white focus:outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]" style={{ fontSize: 16 }}>keyboard_arrow_down</span>
      </div>
    </div>
  );

  return (
    <div className="flex gap-5">
      {/* Main form */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Section 1: Report Details */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-[#4A6FA5] text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</div>
            <h3 className="text-[15px] font-semibold text-[#1A2332]">Report Details</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Report Type <span className="text-[#DC2626]">*</span></div>
              <SelectField value={reportType} onChange={setReportType} options={reportTypes} />
              <div className="mt-1.5 text-[11px] text-[#9CA3AF]">Summary of revenue by date, service, or technician.</div>
            </div>
            <div>
              <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Category <span className="text-[#DC2626]">*</span></div>
              <SelectField value={category} onChange={setCategory} options={categories} />
            </div>
            <div>
              <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Report Name <span className="text-[#DC2626]">*</span></div>
              <div className="relative">
                <input
                  type="text"
                  value={reportName}
                  onChange={e => setReportName(e.target.value.slice(0, 100))}
                  className="w-full h-9 px-3 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1A2332] focus:outline-none focus:border-[#4A6FA5] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                <span>This name will be used for saved reports</span>
                <span>{reportName.length}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Filters */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#4A6FA5] text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</div>
              <h3 className="text-[15px] font-semibold text-[#1A2332]">Filters</h3>
            </div>
            <button className="flex items-center gap-1 text-[12px] text-[#4A6FA5] hover:underline font-medium">
              <span className="material-icons" style={{ fontSize: 14 }}>refresh</span>
              Clear Filters
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Date Range <span className="text-[#DC2626]">*</span></div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 h-9 pl-3 pr-8 border border-[#E5E7EB] rounded-lg text-[13px] text-[#1A2332] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer">
                    <span className="material-icons text-[#546478]" style={{ fontSize: 15 }}>calendar_today</span>
                    <span>This Month (May 1 – May 31, 2025)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 h-9 px-3 border border-[#E5E7EB] rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[13px] text-[#1A2332]">
                  <span className="text-[#9CA3AF]">×</span>
                  <span className="font-medium">+2</span>
                  <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Technicians</div>
              <div className="flex items-center gap-2 h-9 pl-2 pr-2 border border-[#E5E7EB] rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[13px]">
                <span className="flex items-center gap-1 bg-[#EFF6FF] text-[#4A6FA5] text-[12px] px-2 py-0.5 rounded-md">John Smith <span className="ml-0.5 cursor-pointer">×</span></span>
                <span className="flex items-center gap-1 bg-[#EFF6FF] text-[#4A6FA5] text-[12px] px-2 py-0.5 rounded-md">Mike Johnson <span className="ml-0.5 cursor-pointer">×</span></span>
                <span className="material-icons ml-auto text-[#9CA3AF]" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[12px] text-[#6B7280] font-medium">Service / Location</div>
                <SelectField value="All Services / Locations" onChange={() => {}} options={["All Services / Locations"]} />
              </div>
              <div>
                <div className="mb-1 text-[12px] text-[#6B7280] font-medium">&nbsp;</div>
                <SelectField value="Paid, Partially Paid, Unpaid" onChange={() => {}} options={["Paid, Partially Paid, Unpaid", "Paid only", "Unpaid only"]} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[12px] text-[#6B7280] font-medium">Quick Filters</div>
              <div className="flex items-center gap-2 flex-wrap">
                {quickFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveQuickFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-colors ${
                      activeQuickFilter === f
                        ? "bg-[#EFF6FF] text-[#4A6FA5] border-[#4A6FA5]/30"
                        : "bg-white text-[#546478] border-[#E5E7EB] hover:border-[#4A6FA5]/30 hover:text-[#4A6FA5]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Display & Export Options */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-[#4A6FA5] text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</div>
            <h3 className="text-[15px] font-semibold text-[#1A2332]">Display & Export Options</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <SelectField label="Group By" value={groupBy} onChange={setGroupBy} options={groupByOptions} />
            <SelectField label="Sort By" value={sortBy} onChange={setSortBy} options={sortByOptions} />
            <SelectField label="Include Columns" value="8 columns selected" onChange={() => {}} options={["8 columns selected", "All columns", "Custom"]} />
          </div>
          <div className="flex items-center gap-8">
            <div>
              <div className="mb-1.5 text-[12px] text-[#6B7280] font-medium">Output Format</div>
              <div className="flex items-center gap-1 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg p-0.5">
                {(["PDF", "Excel", "CSV"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setOutputFormat(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                      outputFormat === f ? "bg-white text-[#1A2332] shadow-sm" : "text-[#6B7280] hover:text-[#1A2332]"
                    }`}
                  >
                    <span className="material-icons" style={{ fontSize: 14, color: f === "PDF" ? "#DC2626" : f === "Excel" ? "#16A34A" : "#4A6FA5" }}>
                      {f === "PDF" ? "picture_as_pdf" : f === "Excel" ? "table_chart" : "grid_on"}
                    </span>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6 ml-4">
              <div className="flex items-center gap-2">
                <Toggle value={includeSummaryOnly} onChange={setIncludeSummaryOnly} />
                <span className="text-[13px] text-[#546478]">Include summary only</span>
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 14 }}>help_outline</span>
              </div>
              <div className="flex items-center gap-2">
                <Toggle value={includeCharts} onChange={setIncludeCharts} />
                <span className="text-[13px] text-[#546478]">Include charts</span>
                <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 14 }}>help_outline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Schedule Report (Optional) */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#E5E7EB] text-[#6B7280] text-[11px] font-bold flex items-center justify-center shrink-0">4</div>
              <h3 className="text-[15px] font-semibold text-[#1A2332]">Schedule Report <span className="text-[#9CA3AF] font-normal text-[13px]">(Optional)</span></h3>
            </div>
            <div className="flex items-center gap-3">
              <Toggle value={scheduleEnabled} onChange={setScheduleEnabled} />
              <span className="text-[13px] text-[#546478]">Schedule this report</span>
              <span className="material-icons text-[#9CA3AF]" style={{ fontSize: 16 }}>keyboard_arrow_down</span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-medium text-[#546478] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#4A6FA5] bg-white border border-[#4A6FA5]/40 rounded-lg hover:bg-[#EFF6FF] transition-colors">
              <span className="material-icons" style={{ fontSize: 15 }}>visibility</span>
              Preview Report
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[#4A6FA5] rounded-lg hover:bg-[#3d5a85] transition-colors">
              <span className="material-icons" style={{ fontSize: 15 }}>bar_chart</span>
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview sidebar */}
      <div className="w-[260px] shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sticky top-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 16 }}>visibility</span>
              <span className="text-[14px] font-semibold text-[#1A2332]">Report Preview</span>
            </div>
            <span className="text-[11px] font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full">Ready to generate</span>
          </div>
          <div className="space-y-3">
            {[
              { icon: "description", label: "Report Type", value: reportType },
              { icon: "calendar_today", label: "Date Range", value: "May 1 – May 31, 2025 (This Month)" },
              { icon: "filter_alt", label: "Filters", value: "2 Customers, 2 Technicians,\n2 Job Statuses, All Services" },
              { icon: "group", label: "Group By", value: groupBy },
              { icon: "description", label: "Format", value: outputFormat, formatIcon: true },
              { icon: "tune", label: "Includes", value: `8 columns, Charts: ${includeCharts ? "Yes" : "No"}` },
              { icon: "schedule", label: "Schedule", value: scheduleEnabled ? "Enabled" : "Not scheduled" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2.5">
                <span className="material-icons text-[#4A6FA5] mt-0.5 shrink-0" style={{ fontSize: 15 }}>{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-[11px] text-[#9CA3AF] font-medium">{item.label}</div>
                  <div className="text-[12px] text-[#1A2332] font-medium whitespace-pre-line">
                    {item.formatIcon ? (
                      <span className="flex items-center gap-1">
                        <span className="material-icons" style={{ fontSize: 13, color: outputFormat === "PDF" ? "#DC2626" : outputFormat === "Excel" ? "#16A34A" : "#4A6FA5" }}>
                          {outputFormat === "PDF" ? "picture_as_pdf" : outputFormat === "Excel" ? "table_chart" : "grid_on"}
                        </span>
                        {outputFormat}
                      </span>
                    ) : item.value}
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

function ReportsTab({ generateOpen, setGenerateOpen }: { generateOpen: boolean; setGenerateOpen: (v: boolean) => void }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  type ReportRow = { name: string; description: string; lastRun?: string; lastRunColor?: "default" | "orange" };

  const financialReports: ReportRow[] = [
    { name: "Revenue Report", description: "Summary of revenue by date, service, or technician.", lastRun: "2 days ago" },
    { name: "Profit & Loss Statement", description: "Overview of income, cost of goods sold, and expenses." },
    { name: "Invoice Summary (Accounts Receivable)", description: "Outstanding invoices and aging summary.", lastRun: "3 days ago" },
    { name: "Expense Report", description: "Track and summarize business expenses." },
    { name: "Sales Tax Report", description: "Sales tax collected and payable summary.", lastRun: "1 week ago" },
    { name: "Payments Report", description: "Payments received summary by method and date.", lastRun: "1 day ago" },
  ];
  const estimatesReports: ReportRow[] = [
    { name: "Estimates Report", description: "Summary of estimates by status and date range.", lastRun: "1 week ago" },
    { name: "Estimate Conversion Report", description: "Conversion of estimates to jobs and revenue.", lastRun: "2 days ago" },
    { name: "Revenue by Technician", description: "Revenue generated by each technician.", lastRun: "Tomorrow", lastRunColor: "orange" },
  ];
  const jobsReports: ReportRow[] = [
    { name: "Jobs Report", description: "Overview of jobs by status, date, and revenue.", lastRun: "Tomorrow", lastRunColor: "orange" },
    { name: "Job Costing Summary", description: "Job costs, profit margins, and labor analysis.", lastRun: "2 days ago" },
  ];
  const clientsReports: ReportRow[] = [
    { name: "Client Report", description: "Client details and job / revenue summary.", lastRun: "3 days ago" },
    { name: "Team Report", description: "Revenue and performance by technician.", lastRun: "Tomorrow", lastRunColor: "orange" },
    { name: "Items Report (Items Usage Report)", description: "Item usage and inventory movement summary.", lastRun: "5 days ago" },
  ];
  const scheduledReports = [
    { name: "Jobs Report", schedule: "Daily at 7:00 AM", nextRun: "Next run: Tomorrow", orange: true },
    { name: "Revenue Report", schedule: "Weekly on Monday", nextRun: "Next run: Jun 2, 2025", orange: false },
    { name: "Payments Report", schedule: "Monthly on 1st", nextRun: "Next run: Jun 1, 2025", orange: false },
  ];

  const ReportRowItem = ({ r }: { r: ReportRow }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#1A2332] truncate">{r.name}</div>
        <div className="text-[11px] text-[#546478] truncate">{r.description}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {r.lastRun && (
          <span className={`text-[11px] font-medium ${r.lastRunColor === "orange" ? "text-[#D97706]" : "text-[#546478]"}`}>
            {r.lastRun}
          </span>
        )}
        <button className="text-[#546478] hover:text-[#1A2332] transition-colors"><span className="material-icons" style={{ fontSize: 14 }}>visibility</span></button>
        <button className="text-[#546478] hover:text-[#1A2332] transition-colors"><span className="material-icons" style={{ fontSize: 14 }}>calendar_today</span></button>
        <button className="text-[#546478] hover:text-[#1A2332] transition-colors"><span className="material-icons" style={{ fontSize: 14 }}>file_download</span></button>
      </div>
    </div>
  );

  const Section = ({ icon, title, rows }: { icon: string; title: string; rows: ReportRow[] }) => (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 16 }}>{icon}</span>
        <span className="text-[13px] font-bold text-[#1A2332]">{title}</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {rows.map(r => <ReportRowItem key={r.name} r={r} />)}
      </div>
    </div>
  );

  if (generateOpen) {
    return <GenerateReportForm onCancel={() => setGenerateOpen(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div>
            <div className="text-[20px] font-bold text-[#1A2332]">14</div>
            <div className="text-[11px] text-[#546478]">Reports available</div>
          </div>
          <div className="w-9 h-9 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
            <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 18 }}>description</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div>
            <div className="text-[20px] font-bold text-[#1A2332]">2 days ago</div>
            <div className="text-[11px] text-[#546478]">Last export</div>
            <div className="text-[11px] font-semibold text-[#1A2332]">Revenue Report</div>
          </div>
          <div className="w-9 h-9 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
            <span className="material-icons text-[#16A34A]" style={{ fontSize: 18 }}>file_download</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div>
            <div className="text-[20px] font-bold text-[#1A2332]">3</div>
            <div className="text-[11px] text-[#546478]">Scheduled reports</div>
            <div className="text-[11px] text-[#1A2332]">Next: <span className="font-semibold">Jobs Report</span> <span className="text-[#546478]">(Tomorrow)</span></div>
          </div>
          <div className="w-9 h-9 bg-[#FFFBEB] rounded-xl flex items-center justify-center">
            <span className="material-icons text-[#D97706]" style={{ fontSize: 18 }}>schedule</span>
          </div>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-icons absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" style={{ fontSize: 15 }}>search</span>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-[#E5E7EB] rounded-lg text-[#1A2332] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4A6FA5]/30"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1 text-[13px] text-[#1A2332] bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 hover:bg-[#F3F4F6] transition-colors">
            All Categories
            <span className="material-icons text-[#546478]" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
          </button>
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#F3F4F6] text-[#1A2332]" : "text-[#546478]"}`}>
              <span className="material-icons" style={{ fontSize: 16 }}>format_list_bulleted</span>
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#F3F4F6] text-[#1A2332]" : "text-[#546478]"}`}>
              <span className="material-icons" style={{ fontSize: 16 }}>grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left */}
        <div>
          <Section icon="bar_chart" title="Financial / Business" rows={financialReports} />
          <Section icon="description" title="Estimates" rows={estimatesReports} />
        </div>
        {/* Right */}
        <div>
          <Section icon="work" title="Jobs" rows={jobsReports} />
          <Section icon="people" title="Clients / Team / Items" rows={clientsReports} />

          {/* Recent Scheduled Reports */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 16 }}>schedule</span>
                <span className="text-[13px] font-bold text-[#1A2332]">Recent Scheduled Reports</span>
              </div>
              <button className="text-[12px] font-medium text-[#4A6FA5] hover:underline">View all</button>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {scheduledReports.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#1A2332] truncate">{r.name}</div>
                    <div className="text-[11px] text-[#546478]">{r.schedule}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-medium ${r.orange ? "text-[#D97706]" : "text-[#546478]"}`}>{r.nextRun}</span>
                    <button className="text-[#546478] hover:text-[#1A2332] transition-colors"><span className="material-icons" style={{ fontSize: 15 }}>more_horiz</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer banner */}
      <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 text-[12px] text-[#546478]">
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: 15 }}>info</span>
          Need a custom report? Contact support or let us know what you'd like to see.
        </div>
        <button className="flex items-center gap-1 text-[12px] font-medium text-[#4A6FA5] hover:underline">
          Contact Support
          <span className="material-icons" style={{ fontSize: 13 }}>open_in_new</span>
        </button>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Home() {
  const companyName = useSyncExternalStore(companyStore.subscribe, companyStore.getCompanyName);
  const [activeTab, setActiveTab] = useState<DashTab>("All Business");
  const [dateRange, setDateRange] = useState<string>("This Month");
  const [dateOpen, setDateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [generateReportOpen, setGenerateReportOpen] = useState(false);
  const [tabOrder, setTabOrder] = useState<DashTab[]>([...ALL_TABS]);
  const [draggingTab, setDraggingTab] = useState<DashTab | null>(null);
  const [visibleTabs, setVisibleTabs] = useState<Record<DashTab, boolean>>({
    "All Business":         true,
    "Sales Performance":    true,
    "Financial Performance": true,
    "Reports":              true,
  });

  const shownTabs = tabOrder.filter(t => visibleTabs[t]);

  // If active tab gets hidden, fall back to first visible
  const safeTab = shownTabs.includes(activeTab) ? activeTab : shownTabs[0];

  const toggleTab = (tab: DashTab) => {
    // Can't hide last visible tab
    if (visibleTabs[tab] && shownTabs.length === 1) return;
    setVisibleTabs(prev => ({ ...prev, [tab]: !prev[tab] }));
  };

  const moveTab = (source: DashTab, target: DashTab) => {
    if (source === target) return;
    setTabOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(source);
      const to = next.indexOf(target);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <div className="p-8">
      {/* ── Page header ── */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>
            {companyName} Business Insights
          </h1>
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
        {safeTab === "Reports" ? (
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[13px] text-[#6B7280]">Generate, schedule, and export business reports.</p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#1A2332] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F5F7FA] transition-colors shadow-sm">
                <span className="material-icons text-[#546478]" style={{ fontSize: 15 }}>schedule</span>
                Schedule Report
              </button>
              <button
                onClick={() => setGenerateReportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-white bg-[#4A6FA5] rounded-lg hover:bg-[#3d5a85] transition-colors shadow-sm"
              >
                <span className="material-icons" style={{ fontSize: 15 }}>bar_chart</span>
                Generate Report
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#6B7280] mt-0.5">Overview of your business performance</p>
        )}
      </div>

      {/* ── Tabs bar ── */}
      <div className="flex items-center gap-1 mb-6">
        <div className="flex items-center gap-1 p-[3px] rounded-[10px]">
          {shownTabs.map(tab => {
            const isActive = safeTab === tab;
            return (
              <button
                key={tab}
                draggable
                onClick={() => setActiveTab(tab)}
                onDragStart={(event: React.DragEvent<HTMLButtonElement>) => {
                  setDraggingTab(tab);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", tab);
                }}
                onDragOver={(event: React.DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event: React.DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  const source = (event.dataTransfer.getData("text/plain") || draggingTab) as DashTab | null;
                  if (source) moveTab(source, tab);
                  setDraggingTab(null);
                }}
                onDragEnd={() => setDraggingTab(null)}
                aria-grabbed={draggingTab === tab}
                className="h-[29px] px-2 rounded-lg text-[14px] transition-colors whitespace-nowrap inline-flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{
                  fontWeight: 500,
                  background: isActive ? "#4A6FA5" : "transparent",
                  color: isActive ? "#FFFFFF" : "#6B7280",
                  opacity: draggingTab === tab ? 0.6 : 1,
                  boxShadow: isActive
                    ? "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)"
                    : "none",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Customize tabs */}
        <div className="relative">
          <button
            onClick={() => setEditOpen(v => !v)}
            title="Customize tabs"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              editOpen ? "text-[#4A6FA5] bg-[#EBF0F8]" : "text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]"
            }`}
          >
            <ColumnSettingsIcon className="h-4 w-4" />
          </button>

          {editOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setEditOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-2 px-1" style={{ fontWeight: 600 }}>
                  Show / hide tabs
                </div>
                {tabOrder.map(tab => {
                  const isVisible = visibleTabs[tab];
                  const isLast = shownTabs.length === 1 && isVisible;
                  return (
                    <button
                      key={tab}
                      onClick={() => !isLast && toggleTab(tab)}
                      disabled={isLast}
                      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-[13px] transition-colors ${
                        isLast
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[#F5F7FA] cursor-pointer"
                      }`}
                    >
                      <span className={isVisible ? "text-[#1A2332]" : "text-[#9CA3AF]"} style={{ fontWeight: 500 }}>
                        {tab}
                      </span>
                      <span
                        className={`material-icons text-[18px] ${isVisible ? "text-[#4A6FA5]" : "text-[#D1D5DB]"}`}
                      >
                        {isVisible ? "check_box" : "check_box_outline_blank"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tab content ── */}
      {safeTab === "All Business"          && <AllBusinessTab />}
      {safeTab === "Sales Performance"     && <SalesPerformanceTab />}
      {safeTab === "Financial Performance" && <FinancialPerformanceTab />}
      {safeTab === "Reports"               && <ReportsTab generateOpen={generateReportOpen} setGenerateOpen={setGenerateReportOpen} />}
    </div>
  );
}
