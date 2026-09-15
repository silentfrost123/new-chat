import { db } from "@/lib/db";
import { usageRecords, users, characters, categories } from "@/lib/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { AnalyticsCharts } from "./charts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const dailyUsage = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const count = Number(
      db
        .select({ c: sql<number>`coalesce(sum(${usageRecords.amount}), 0)` })
        .from(usageRecords)
        .where(eq(usageRecords.date, d))
        .get()?.c || 0
    );
    dailyUsage.push({ date: d.slice(5), messages: count });
  }

  const planCounts = {
    free: Number(
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "free")).get()?.c || 0
    ),
    plus: Number(
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "plus")).get()?.c || 0
    ),
    pro: Number(
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "pro")).get()?.c || 0
    ),
  };

  const topCharacters = db
    .select({
      name: characters.name,
      chatCount: characters.chatCount,
      likeCount: characters.likeCount,
    })
    .from(characters)
    .where(eq(characters.status, "published"))
    .orderBy(desc(characters.chatCount))
    .limit(10)
    .all();

  const cats = db.select().from(categories).all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-2">Analytics</h1>
      <p className="text-muted-foreground text-sm mb-8">Last 30 days</p>
      <AnalyticsCharts
        dailyUsage={dailyUsage}
        planCounts={planCounts}
        topCharacters={topCharacters}
        categories={cats.map((c) => ({ name: c.name, icon: c.icon }))}
      />
    </div>
  );
}
