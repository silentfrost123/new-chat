import { db } from "@/lib/db";
import { users, plans, usageRecords } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
  message?: string;
}> {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return { allowed: false, remaining: 0, limit: 0, plan: "free", message: "User not found" };
  }

  const plan = db
    .select()
    .from(plans)
    .where(eq(plans.slug, user.plan || "free"))
    .get();

  const limit = plan?.messageLimit ?? 50;
  const today = new Date().toISOString().slice(0, 10);

  const result = db
    .select({ total: sql<number>`coalesce(sum(${usageRecords.amount}), 0)` })
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.date, today),
        eq(usageRecords.type, "message")
      )
    )
    .get();

  const used = Number(result?.total || 0);
  const remaining = Math.max(0, limit - used);

  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      plan: user.plan,
      message: "You've reached your current usage limit. Upgrade your plan for more messages.",
    };
  }

  return { allowed: true, remaining, limit, plan: user.plan };
}

export function recordUsage(params: {
  userId: string;
  conversationId?: string;
  characterId?: string;
  type: string;
  model?: string;
  amount?: number;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  db.insert(usageRecords)
    .values({
      id: randomUUID(),
      userId: params.userId,
      conversationId: params.conversationId,
      characterId: params.characterId,
      type: params.type,
      model: params.model,
      amount: params.amount ?? 1,
      tokensIn: params.tokensIn ?? 0,
      tokensOut: params.tokensOut ?? 0,
      durationMs: params.durationMs,
      date: today,
    })
    .run();

  if (params.type === "message") {
    db.update(users)
      .set({
        messageCount: sql`${users.messageCount} + 1`,
        tokenCount: sql`${users.tokenCount} + ${params.tokensOut || 0}`,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.userId))
      .run();
  }
}
