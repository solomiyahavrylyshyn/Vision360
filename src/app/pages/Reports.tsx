import { Card } from "../components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
      <div className="mb-8">
        <h1 className="text-[22px] text-[#1A2332]" style={{ fontWeight: 700 }}>Reports & Analytics</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <Card className="p-5 border border-[#DDE3EE] bg-white">
          <div className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 500 }}>Total Revenue</div>
          <div className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$109,800</div>
          <div className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>trending_up</span>
            +18% vs last period
          </div>
        </Card>
        <Card className="p-5 border border-[#DDE3EE] bg-white">
          <div className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 500 }}>Total Expenses</div>
          <div className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$61,300</div>
          <div className="text-[12px] text-[#D97706] flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>trending_up</span>
            +12% vs last period
          </div>
        </Card>
        <Card className="p-5 border border-[#DDE3EE] bg-white">
          <div className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 500 }}>Net Profit</div>
          <div className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>$48,500</div>
          <div className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>trending_up</span>
            +24% vs last period
          </div>
        </Card>
        <Card className="p-5 border border-[#DDE3EE] bg-white">
          <div className="text-[13px] text-[#546478] mb-3" style={{ fontWeight: 500 }}>Profit Margin</div>
          <div className="text-[28px] text-[#1A2332] mb-1" style={{ fontWeight: 700 }}>44.2%</div>
          <div className="text-[12px] text-[#16A34A] flex items-center gap-1" style={{ fontWeight: 500 }}>
            <span className="material-icons" style={{ fontSize: "14px" }}>trending_up</span>
            +5% vs last period
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="p-6 border border-[#DDE3EE] bg-white">
          <h3 className="text-[16px] text-[#1A2332] mb-5" style={{ fontWeight: 600 }}>Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EE" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar key="revenue" dataKey="revenue" fill="#4A6FA5" name="Revenue" />
              <Bar key="expenses" dataKey="expenses" fill="#D97706" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border border-[#DDE3EE] bg-white">
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