import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, adminActions, moderationEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { userId, action, reason } = await req.json();

    const target = db.select().from(users).where(eq(users.id, userId)).get();
    if (!target || target.role === "admin") {
      return NextResponse.json({ error: "Cannot modify this user" }, { status: 400 });
    }

    if (action === "ban") {
      db.update(users)
        .set({ isBanned: true, banReason: reason || "Violated community guidelines", updatedAt: new Date() })
        .where(eq(users.id, userId))
        .run();
    } else if (action === "unban") {
      db.update(users)
        .set({ isBanned: false, banReason: null, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .run();
    } else if (action === "make_moderator") {
      db.update(users)
        .set({ role: "moderator", updatedAt: new Date() })
        .where(eq(users.id, userId))
        .run();
    }

    db.insert(adminActions)
      .values({
        id: randomUUID(),
        adminId: admin.id,
        action,
        targetType: "user",
        targetId: userId,
        details: reason,
      })
      .run();

    db.insert(moderationEvents)
      .values({
        id: randomUUID(),
        userId,
        action,
        reason,
        moderatorId: admin.id,
      })
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
