import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites, characters } from "@/lib/db/schema";
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
    .from(favorites)
    .where(
      and(eq(favorites.userId, session.user.id), eq(favorites.characterId, characterId))
    )
    .get();

  if (existing) {
    db.delete(favorites).where(eq(favorites.id, existing.id)).run();
    db.update(characters)
      .set({ favoriteCount: sql`max(0, ${characters.favoriteCount} - 1)` })
      .where(eq(characters.id, characterId))
      .run();
    return NextResponse.json({ favorited: false });
  }

  db.insert(favorites)
    .values({ id: randomUUID(), userId: session.user.id, characterId })
    .run();
  db.update(characters)
    .set({ favoriteCount: sql`${characters.favoriteCount} + 1` })
    .where(eq(characters.id, characterId))
    .run();

  return NextResponse.json({ favorited: true });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      shortDescription: characters.shortDescription,
      avatarUrl: characters.avatarUrl,
      likeCount: characters.likeCount,
      chatCount: characters.chatCount,
      contentRating: characters.contentRating,
    })
    .from(favorites)
    .innerJoin(characters, eq(favorites.characterId, characters.id))
    .where(eq(favorites.userId, session.user.id))
    .all();

  return NextResponse.json({ favorites: list });
}
