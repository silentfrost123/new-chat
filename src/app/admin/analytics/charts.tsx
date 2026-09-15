"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4"];

export function AnalyticsCharts({
  dailyUsage,
  planCounts,
  topCharacters,
}: {
  dailyUsage: { date: string; messages: number }[];
  planCounts: { free: number; plus: number; pro: number };
  topCharacters: { name: string; chatCount: number; likeCount: number }[];
  categories: { name: string; icon: string | null }[];
}) {
  const planData = [
    { name: "Free", value: planCounts.free },
    { name: "Plus", value: planCounts.plus },
    { name: "Pro", value: planCounts.pro },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Messages over time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyUsage}>
              <defs>
                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" fontSize={11} />
              <YAxis stroke="#666" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a22",
                  border: "1px solid #333",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#8b5cf6"
                fill="url(#msgGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Plan distribution</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1a22",
                    border: "1px solid #333",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Top characters by chats</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCharacters} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#666" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#666"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a22",
                    border: "1px solid #333",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="chatCount" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
