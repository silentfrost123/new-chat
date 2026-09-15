import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { likes, characters, notifications } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await req.json();
  if (!characterId) {
    return NextResponse.json({ error: "characterId required" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, session.user.id), eq(likes.characterId, characterId)))
    .get();

  if (existing) {
    db.delete(likes).where(eq(likes.id, existing.id)).run();
    db.update(characters)
      .set({ likeCount: sql`max(0, ${characters.likeCount} - 1)` })
      .where(eq(characters.id, characterId))
      .run();
    return NextResponse.json({ liked: false });
  }

  db.insert(likes)
    .values({ id: randomUUID(), userId: session.user.id, characterId })
    .run();
  db.update(characters)
    .set({ likeCount: sql`${characters.likeCount} + 1` })
    .where(eq(characters.id, characterId))
    .run();

  const char = db.select().from(characters).where(eq(characters.id, characterId)).get();
  if (char && char.creatorId !== session.user.id) {
    db.insert(notifications)
      .values({
        id: randomUUID(),
        userId: char.creatorId,
        type: "like",
        title: "New like",
        body: `Someone liked ${char.name}`,
        link: `/character/${char.slug}`,
        actorId: session.user.id,
      })
      .run();
  }

  return NextResponse.json({ liked: true });
}
