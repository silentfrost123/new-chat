import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { follows, users, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(follows)
    .where(
      and(eq(follows.followerId, session.user.id), eq(follows.followingId, userId))
    )
    .get();

  if (existing) {
    db.delete(follows).where(eq(follows.id, existing.id)).run();
    return NextResponse.json({ following: false });
  }

  db.insert(follows)
    .values({
      id: randomUUID(),
      followerId: session.user.id,
      followingId: userId,
    })
    .run();

  const target = db.select().from(users).where(eq(users.id, userId)).get();
  db.insert(notifications)
    .values({
      id: randomUUID(),
      userId,
      type: "follow",
      title: "New follower",
      body: `${session.user.name || session.user.username || "Someone"} started following you`,
      link: session.user.username ? `/profile/${session.user.username}` : undefined,
      actorId: session.user.id,
    })
    .run();

  return NextResponse.json({ following: true, username: target?.username });
}
