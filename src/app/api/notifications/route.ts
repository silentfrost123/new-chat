import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";

  const conditions = [eq(notifications.userId, session.user.id)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  const list = db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all();

  const unreadCount = db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))
    )
    .all().length;

  return NextResponse.json({ notifications: list, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.markAllRead) {
    db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.user.id))
      .run();
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    db.update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, body.id), eq(notifications.userId, session.user.id))
      )
      .run();
  }

  return NextResponse.json({ success: true });
}
