import { db } from "@/lib/db";
import {
  users,
  characters,
  conversations,
  messages,
  reports,
  usageRecords,
} from "@/lib/db/schema";
import { sql, eq, gte } from "drizzle-orm";
import { Users, Bot, MessageSquare, Flag, Activity, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const totalUsers = Number(
    db.select({ c: sql<number>`count(*)` }).from(users).get()?.c || 0
  );
  const totalCharacters = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(characters)
      .where(eq(characters.status, "published"))
      .get()?.c || 0
  );
  const totalConversations = Number(
    db.select({ c: sql<number>`count(*)` }).from(conversations).get()?.c || 0
  );
  const totalMessages = Number(
    db.select({ c: sql<number>`count(*)` }).from(messages).get()?.c || 0
  );
  const pendingReports = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, "pending"))
      .get()?.c || 0
  );

  const dayAgo = new Date(Date.now() - 86400000);
  const activeUsers = Number(
    db
      .select({ c: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.lastActiveAt, dayAgo))
      .get()?.c || 0
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayMessages = Number(
    db
      .select({ c: sql<number>`coalesce(sum(${usageRecords.amount}), 0)` })
      .from(usageRecords)
      .where(eq(usageRecords.date, today))
      .get()?.c || 0
  );

  const recentUsers = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      plan: users.plan,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} desc`)
    .limit(8)
    .all();

  const stats = [
    { label: "Users", value: totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Characters", value: totalCharacters, icon: Bot, color: "text-violet-400" },
    { label: "Conversations", value: totalConversations, icon: MessageSquare, color: "text-pink-400" },
    { label: "Messages", value: totalMessages, icon: Zap, color: "text-amber-400" },
    { label: "Active 24h", value: activeUsers, icon: Activity, color: "text-emerald-400" },
    { label: "Pending reports", value: pendingReports, icon: Flag, color: "text-rose-400" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Platform overview · {todayMessages} messages today
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Recent users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3">
                    {u.name}
                    {u.username && (
                      <span className="text-muted-foreground ml-1">@{u.username}</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 capitalize">{u.plan}</td>
                  <td className="p-3 text-muted-foreground">
                    {u.createdAt
                      ? new Date(
                          typeof u.createdAt === "number"
                            ? u.createdAt * 1000
                            : u.createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
