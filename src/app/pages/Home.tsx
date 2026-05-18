import * as React from "react";
import { useState, useSyncExternalStore } from "react";
import { companyStore } from "../stores/companyStore";
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
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-2" style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      <div className="flex flex-col gap-1 flex-1">
        <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>{value}</div>
        <div className="text-[16px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "24px" }}>{label}</div>
        <div className={`flex items-center gap-1 text-[12px] ${changeUp ? "text-[#16A34A]" : "text-[#DC2626]"}`} style={{ fontWeight: 400, lineHeight: "16px" }}>
          <span className="material-icons" style={{ fontSize: "14px" }}>{changeUp ? "trending_up" : "trending_down"}</span>
          {change}
          <span className="text-[#6B7280] font-normal ml-1">vs last period</span>
        </div>
      </div>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <span className="material-icons" style={{ fontSize: "24px", color: iconColor }}>{icon}</span>
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
      <div className="grid grid-cols-4 gap-4">
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
      <div className="grid grid-cols-4 gap-4">
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
      <div className="grid grid-cols-4 gap-4">
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

function ReportsTab() {
  // PDF / CSV file-shape icon
  const FileIcon = ({ type }: { type: "PDF" | "CSV" }) => {
    const color = type === "PDF" ? "#DC2626" : "#16A34A";
    return (
      <div className="relative shrink-0" style={{ width: 24, height: 28 }}>
        {/* Page body */}
        <div className="absolute inset-0 rounded-sm" style={{ background: color }} />
        {/* Folded corner */}
        <div className="absolute top-0 right-0" style={{
          width: 7, height: 7,
          background: "#E4E7EC",
          boxShadow: "-1.5px 1.5px 3px rgba(0,0,0,0.2)",
        }} />
        {/* Label badge */}
        <div className="absolute left-0 right-0 flex items-center justify-center" style={{ bottom: 3, height: 9 }}>
          <span className="text-white" style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.2px" }}>{type}</span>
        </div>
      </div>
    );
  };

  const reportItems: { type: "PDF" | "CSV"; title: string; desc: string }[] = [
    { type: "PDF", title: "Revenue report",           desc: "Monthly revenue breakdown by client and job type" },
    { type: "PDF", title: "Invoice summary",          desc: "Paid, unpaid, and overdue invoice totals" },
    { type: "PDF", title: "Profit & loss statement",  desc: "Net profit summary with expense categories" },
    { type: "CSV", title: "Client report",            desc: "Top clients by revenue and job count" },
    { type: "CSV", title: "Jobs report",              desc: "Completed, scheduled, and in-progress jobs" },
    { type: "CSV", title: "Expense report",           desc: "All expenses by category and time period" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Summary row (per Figma) ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: "45",         label: "Reports generated", sub: "this month",            icon: "sync",            iconBg: "rgba(74,111,165,0.15)",  iconColor: "#4A6FA5" },
          { value: "2 days ago", label: "Last export",        sub: "Revenue report (PDF)",  icon: "file_download",   iconBg: "rgba(22,163,74,0.15)",   iconColor: "#16A34A" },
          { value: "3",          label: "Scheduled reports",  sub: "Next run in 5 days",   icon: "schedule",        iconBg: "rgba(245,158,11,0.15)",  iconColor: "#F59E0B" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#E5E7EB] rounded-lg p-4 flex items-start gap-2" style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
            <div className="flex flex-col gap-1 flex-1">
              <div className="text-[24px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "135%" }}>{c.value}</div>
              <div className="text-[16px] text-[#6B7280]" style={{ fontWeight: 600, lineHeight: "24px" }}>{c.label}</div>
              <div className="text-[12px] text-[#6B7280]" style={{ fontWeight: 400, lineHeight: "16px" }}>{c.sub}</div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.iconBg }}>
              <span className="material-icons" style={{ fontSize: "24px", color: c.iconColor }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Available reports (per Figma) ────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <h2 className="text-[16px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "24px" }}>Available reports</h2>
          <button className="h-8 px-3 flex items-center justify-center gap-1.5 bg-[#4A6FA5] hover:bg-[#3d5a85] rounded-lg text-white text-[14px] transition-colors" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "16px" }}>file_download</span>
            Export all
          </button>
        </div>

        {/* Report rows — 2-col grid, 16px gap, 16px h padding */}
        <div className="grid grid-cols-2 gap-4 px-4 pb-4">
          {reportItems.map(r => (
            <div
              key={r.title}
              className="flex items-start justify-between gap-2 p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <FileIcon type={r.type} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="text-[14px] text-[#1A2332]" style={{ fontWeight: 600, lineHeight: "20px" }}>{r.title}</div>
                  <div className="text-[14px] text-[#6B7280] truncate" style={{ fontWeight: 400, lineHeight: "20px" }}>{r.desc}</div>
                </div>
              </div>
              <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors shrink-0">
                <span className="material-icons text-[#1A2332]" style={{ fontSize: "16px" }}>file_download</span>
              </button>
            </div>
          ))}
        </div>
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
  const [visibleTabs, setVisibleTabs] = useState<Record<DashTab, boolean>>({
    "All Business":         true,
    "Sales Performance":    true,
    "Financial Performance": true,
    "Reports":              true,
  });

  const shownTabs = ALL_TABS.filter(t => visibleTabs[t]);

  // If active tab gets hidden, fall back to first visible
  const safeTab = shownTabs.includes(activeTab) ? activeTab : shownTabs[0];

  const toggleTab = (tab: DashTab) => {
    // Can't hide last visible tab
    if (visibleTabs[tab] && shownTabs.length === 1) return;
    setVisibleTabs(prev => ({ ...prev, [tab]: !prev[tab] }));
  };

  return (
    <div className="p-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>
            {companyName} Business Insights
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

      {/* ── Tabs bar ── */}
      <div className="flex items-center gap-0 border-b border-[#E5E7EB] mb-6">
        {shownTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
              safeTab === tab
                ? "border-[#4A6FA5] text-[#4A6FA5]"
                : "border-transparent text-[#6B7280] hover:text-[#374151]"
            }`}
            style={{ fontWeight: safeTab === tab ? 600 : 500 }}
          >
            {tab}
          </button>
        ))}

        {/* Customize tabs pencil */}
        <div className="relative ml-2">
          <button
            onClick={() => setEditOpen(v => !v)}
            title="Customize tabs"
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              editOpen ? "text-[#4A6FA5] bg-[#EBF0F8]" : "text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]"
            }`}
          >
            <span className="material-icons" style={{ fontSize: "16px" }}>settings</span>
          </button>

          {editOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setEditOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-[220px] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-3">
                <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-2 px-1" style={{ fontWeight: 600 }}>
                  Show / hide tabs
                </div>
                {ALL_TABS.map(tab => {
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
      {safeTab === "Reports"               && <ReportsTab />}
    </div>
  );
}
