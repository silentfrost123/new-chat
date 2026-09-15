import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  characters,
  conversations,
  messages,
  reports,
  usageRecords,
  subscriptions,
} from "@/lib/db/schema";
import { sql, eq, gte } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalUsers = db.select({ c: sql<number>`count(*)` }).from(users).get()?.c || 0;
  const totalCharacters =
    db
      .select({ c: sql<number>`count(*)` })
      .from(characters)
      .where(eq(characters.status, "published"))
      .get()?.c || 0;
  const totalConversations =
    db.select({ c: sql<number>`count(*)` }).from(conversations).get()?.c || 0;
  const totalMessages =
    db.select({ c: sql<number>`count(*)` }).from(messages).get()?.c || 0;
  const pendingReports =
    db
      .select({ c: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, "pending"))
      .get()?.c || 0;

  const dayAgo = new Date(Date.now() - 86400000);
  const activeUsers =
    db
      .select({ c: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.lastActiveAt, dayAgo))
      .get()?.c || 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayMessages =
    db
      .select({ c: sql<number>`coalesce(sum(${usageRecords.amount}), 0)` })
      .from(usageRecords)
      .where(eq(usageRecords.date, today))
      .get()?.c || 0;

  // Last 7 days message volume
  const dailyUsage = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const count =
      db
        .select({ c: sql<number>`coalesce(sum(${usageRecords.amount}), 0)` })
        .from(usageRecords)
        .where(eq(usageRecords.date, d))
        .get()?.c || 0;
    dailyUsage.push({ date: d, messages: Number(count) });
  }

  const planCounts = {
    free:
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "free")).get()
        ?.c || 0,
    plus:
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "plus")).get()
        ?.c || 0,
    pro:
      db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.plan, "pro")).get()
        ?.c || 0,
  };

  return NextResponse.json({
    totalUsers: Number(totalUsers),
    totalCharacters: Number(totalCharacters),
    totalConversations: Number(totalConversations),
    totalMessages: Number(totalMessages),
    pendingReports: Number(pendingReports),
    activeUsers24h: Number(activeUsers),
    todayMessages: Number(todayMessages),
    dailyUsage,
    planCounts: {
      free: Number(planCounts.free),
      plus: Number(planCounts.plus),
      pro: Number(planCounts.pro),
    },
  });
}
