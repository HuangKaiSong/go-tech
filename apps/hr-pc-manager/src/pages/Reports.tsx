import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const turnoverData = [
  { month: "1月", rate: 2.1 },
  { month: "2月", rate: 1.8 },
  { month: "3月", rate: 2.5 },
  { month: "4月", rate: 1.9 },
  { month: "5月", rate: 2.2 },
  { month: "6月", rate: 2.0 },
];

const ageDistribution = [
  { name: "20-25歲", value: 180, color: "hsl(215, 70%, 55%)" },
  { name: "26-30歲", value: 380, color: "hsl(200, 75%, 45%)" },
  { name: "31-35歲", value: 320, color: "hsl(142, 60%, 40%)" },
  { name: "36-40歲", value: 240, color: "hsl(38, 92%, 50%)" },
  { name: "40歲以上", value: 164, color: "hsl(280, 60%, 55%)" },
];

const salaryByDept = [
  { dept: "技術部", avg: 62000 },
  { dept: "銷售部", avg: 48000 },
  { dept: "市場部", avg: 45000 },
  { dept: "運營部", avg: 52000 },
  { dept: "財務部", avg: 50000 },
  { dept: "人事部", avg: 42000 },
];

const attendanceTrend = [
  { month: "1月", rate: 95.2 },
  { month: "2月", rate: 94.8 },
  { month: "3月", rate: 96.1 },
  { month: "4月", rate: 95.7 },
  { month: "5月", rate: 96.3 },
  { month: "6月", rate: 96.5 },
];

export default function Reports() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          報表分析
        </h1>
        <p className="page-description">人力資源數據分析與報表</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">離職率趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={turnoverData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)' }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="離職率" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">年齡分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ageDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                  {ageDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">各部門平均薪資</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salaryByDept}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dept" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <YAxis tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="avg" fill="hsl(200, 75%, 45%)" radius={[4, 4, 0, 0]} name="平均薪資" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">出勤率趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                <YAxis domain={[93, 98]} tick={{ fill: 'hsl(215, 15%, 50%)' }} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(142, 60%, 40%)" strokeWidth={2} name="出勤率" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
