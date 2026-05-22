import { Card } from "../components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PageHeader } from "../components/ui/page-header";

const revenueData = [
  { month: "Jan", revenue: 12400, expenses: 8200 },
  { month: "Feb", revenue: 15600, expenses: 9100 },
  { month: "Mar", revenue: 18200, expenses: 10400 },
  { month: "Apr", revenue: 16800, expenses: 9800 },
  { month: "May", revenue: 21300, expenses: 11200 },
  { month: "Jun", revenue: 24500, expenses: 12600 },
];

const clientData = [
  { name: "John Smith", value: 12450 },
  { name: "Mike Davis", value: 8900 },
  { name: "Sarah Johnson", value: 6700 },
  { name: "Others", value: 15200 },
];

const COLORS = ["#4A6FA5", "#16A34A", "#D97706", "#546478"];

export function Reports() {
  return (
    <div className="p-8">
      <PageHeader title="Reports & Analytics" />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Card className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" title="+18% vs last period">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-col justify-center">
              <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$109,800</div>
              <div className="mt-0.5 truncate text-[11px] text-[#546478]">Total Revenue</div>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" title="+12% vs last period">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-col justify-center">
              <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$61,300</div>
              <div className="mt-0.5 truncate text-[11px] text-[#546478]">Total Expenses</div>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" title="+24% vs last period">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-col justify-center">
              <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$48,500</div>
              <div className="mt-0.5 truncate text-[11px] text-[#546478]">Net Profit</div>
            </div>
          </div>
        </Card>
        <Card className="flex min-h-[56px] min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" title="+5% vs last period">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-col justify-center">
              <div className="truncate text-[18px] leading-tight text-[#1A2332]" style={{ fontWeight: 700 }}>44.2%</div>
              <div className="mt-0.5 truncate text-[11px] text-[#546478]">Profit Margin</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="p-6 border border-[#E5E7EB] bg-white">
          <h3 className="text-[16px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar key="revenue" dataKey="revenue" fill="#4A6FA5" name="Revenue" />
              <Bar key="expenses" dataKey="expenses" fill="#D97706" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border border-[#E5E7EB] bg-white">
          <h3 className="text-[16px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue by Client</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {clientData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
