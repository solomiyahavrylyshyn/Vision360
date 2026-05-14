import * as React from "react";
import { useState } from "react";
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
  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: "description",   iconBg: "#EBF0F8", iconColor: "#4A6FA5", label: "Estimates Sent",   value: "128",   change: "+14%", changeUp: true  },
          { icon: "check_circle",  iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Conversion Rate",  value: "76.6%", change: "+5%",  changeUp: true  },
          { icon: "work",          iconBg: "#FEF3C7", iconColor: "#D97706", label: "Jobs Won",         value: "98",    change: "+18%", changeUp: true  },
          { icon: "people",        iconBg: "#F0F9FF", iconColor: "#0EA5E9", label: "New Clients",      value: "24",    change: "+9%",  changeUp: true  },
        ].map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* Estimates vs Converted */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Estimates vs Jobs Won</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F9FAFB" }} />
              <Bar dataKey="estimates" name="Estimates" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Won" fill="#4A6FA5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#CBD5E1]" />Estimates</div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#4A6FA5]" />Won</div>
          </div>
        </div>

        {/* Revenue trend */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4A6FA5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4A6FA5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={<CustomBarTooltip />} />
              <Area dataKey="revenue" name="Revenue" stroke="#4A6FA5" strokeWidth={2} fill="url(#salesGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top clients table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h2 className="text-[15px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Top Clients by Revenue</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              {["Client", "Jobs", "Revenue", "vs Last Period"].map(h => (
                <th key={h} className="text-left pb-2 text-[11px] text-[#9CA3AF] uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topClientsData.map((c, i) => (
              <tr key={c.name} className={i < topClientsData.length - 1 ? "border-b border-[#F9FAFB]" : ""}>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#EBF0F8] flex items-center justify-center text-[11px] text-[#4A6FA5]" style={{ fontWeight: 700 }}>
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td className="py-3 text-[13px] text-[#6B7280]">{c.jobs}</td>
                <td className="py-3 text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>${c.revenue.toLocaleString()}</td>
                <td className="py-3">
                  <span className={`text-[12px] ${c.change.startsWith("+") ? "text-[#16A34A]" : "text-[#DC2626]"}`} style={{ fontWeight: 500 }}>{c.change}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialPerformanceTab() {
  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: "account_balance_wallet", iconBg: "#DCFCE7", iconColor: "#16A34A", label: "Total Collected",  value: "$14,628", change: "+11%", changeUp: true  },
          { icon: "pending",                iconBg: "#FEF3C7", iconColor: "#D97706", label: "Outstanding",      value: "$9,389",  change: "+2%",  changeUp: false },
          { icon: "receipt_long",           iconBg: "#FEF2F2", iconColor: "#DC2626", label: "Total Expenses",   value: "$61,300", change: "-12%", changeUp: false },
          { icon: "savings",                iconBg: "#EBF0F8", iconColor: "#4A6FA5", label: "Net Cash Flow",    value: "$47,900", change: "+31%", changeUp: true  },
        ].map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Cash flow + invoice status */}
      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* Cash flow chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Cash Flow</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#DC2626" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={<CustomBarTooltip />} />
              <Area dataKey="inflow"  name="Inflow"  stroke="#16A34A" strokeWidth={2} fill="url(#inflowGrad)"  dot={false} />
              <Area dataKey="outflow" name="Outflow" stroke="#DC2626" strokeWidth={2} fill="url(#outflowGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#16A34A]" />Inflow</div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]"><span className="w-3 h-3 rounded-sm bg-[#DC2626]" />Outflow</div>
          </div>
        </div>

        {/* Invoice status */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-[15px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Invoice Status</h2>
          <div className="flex flex-col gap-3">
            {invoiceStatusData.map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-[13px] text-[#374151]">{item.status}</span>
                  <span className="text-[11px] text-[#9CA3AF]">({item.count})</span>
                </div>
                <span className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>${item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {/* Mini donut */}
          <div className="flex justify-center mt-4">
            <div className="w-[120px] h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invoiceStatusData} cx="50%" cy="50%" innerRadius={32} outerRadius={54} dataKey="amount" startAngle={90} endAngle={-270} strokeWidth={2}>
                    {invoiceStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses breakdown */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h2 className="text-[15px] text-[#1A2332] mb-4" style={{ fontWeight: 600 }}>Expenses by Category</h2>
        <div className="grid grid-cols-5 gap-4">
          {expensesByCategoryData.map(cat => (
            <div key={cat.category} className="text-center">
              <div className="text-[11px] text-[#9CA3AF] mb-2" style={{ fontWeight: 500 }}>{cat.category}</div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, background: cat.color }} />
              </div>
              <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>${(cat.amount / 1000).toFixed(1)}K</div>
              <div className="text-[11px] text-[#9CA3AF]">{cat.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  const reportItems = [
    { icon: "bar_chart",        iconBg: "#EBF0F8", iconColor: "#4A6FA5", title: "Revenue Report",           desc: "Monthly revenue breakdown by client and job type", badge: "PDF" },
    { icon: "receipt",          iconBg: "#DCFCE7", iconColor: "#16A34A", title: "Invoice Summary",           desc: "Paid, unpaid, and overdue invoice totals",           badge: "PDF" },
    { icon: "account_balance",  iconBg: "#FEF3C7", iconColor: "#D97706", title: "Profit & Loss Statement",  desc: "Net profit summary with expense categories",         badge: "PDF" },
    { icon: "people",           iconBg: "#F0F9FF", iconColor: "#0EA5E9", title: "Client Report",            desc: "Top clients by revenue and job count",               badge: "CSV" },
    { icon: "work",             iconBg: "#F3E8FF", iconColor: "#9333EA", title: "Jobs Report",              desc: "Completed, scheduled, and in-progress jobs",         badge: "CSV" },
    { icon: "payments",         iconBg: "#FEF2F2", iconColor: "#DC2626", title: "Expense Report",           desc: "All expenses by category and time period",           badge: "CSV" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Reports Generated", value: "48", sub: "this month", icon: "description", iconBg: "#EBF0F8", iconColor: "#4A6FA5" },
          { label: "Last Export",       value: "2d ago", sub: "Revenue Report · PDF", icon: "file_download", iconBg: "#DCFCE7", iconColor: "#16A34A" },
          { label: "Scheduled Reports", value: "3",    sub: "next run in 5 days",    icon: "schedule", iconBg: "#FEF3C7", iconColor: "#D97706" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.iconBg }}>
              <span className="material-icons" style={{ fontSize: "22px", color: c.iconColor }}>{c.icon}</span>
            </div>
            <div>
              <div className="text-[24px] text-[#1A2332] leading-none mb-0.5" style={{ fontWeight: 700 }}>{c.value}</div>
              <div className="text-[13px] text-[#6B7280]">{c.label}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Report list */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] text-[#1A2332]" style={{ fontWeight: 600 }}>Available Reports</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A6FA5] text-white rounded-lg text-[12px] hover:bg-[#3d5a85] transition-colors" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>file_download</span>
            Export All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {reportItems.map(r => (
            <div key={r.title} className="flex items-center gap-3 p-3.5 border border-[#F3F4F6] rounded-xl hover:border-[#E5E7EB] hover:bg-[#FAFAFA] transition-all cursor-pointer group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.iconBg }}>
                <span className="material-icons" style={{ fontSize: "18px", color: r.iconColor }}>{r.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1A2332]" style={{ fontWeight: 600 }}>{r.title}</div>
                <div className="text-[11px] text-[#9CA3AF] truncate">{r.desc}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded" style={{ fontWeight: 600 }}>{r.badge}</span>
                <span className="material-icons text-[#9CA3AF] group-hover:text-[#4A6FA5] transition-colors" style={{ fontSize: "16px" }}>file_download</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Home() {
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
            <span className="material-icons" style={{ fontSize: "16px" }}>edit</span>
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
