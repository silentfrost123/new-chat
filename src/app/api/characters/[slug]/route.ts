import { NextRequest, NextResponse } from "next/server";
import { getCharacterBySlug, incrementView } from "@/lib/characters";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters, characterTags, tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  const character = getCharacterBySlug(params.slug, session?.user?.id);

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Privacy check
  if (
    character.status !== "published" &&
    character.creator.id !== session?.user?.id &&
    session?.user?.role !== "admin"
  ) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  incrementView(character.id);

  return NextResponse.json({ character });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = db
      .select()
      .from(characters)
      .where(eq(characters.slug, params.slug))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      existing.creatorId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowed = [
      "name",
      "shortDescription",
      "description",
      "personality",
      "backstory",
      "scenario",
      "greeting",
      "exampleDialogue",
      "speakingStyle",
      "goals",
      "likes",
      "dislikes",
      "knowledge",
      "worldInfo",
      "systemInstructions",
      "avatarUrl",
      "coverUrl",
      "categoryId",
      "visibility",
      "contentRating",
      "status",
    ] as const;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    if (body.traits) {
      updates.traits = JSON.stringify(body.traits);
    }
    if (body.status === "published" && existing.status !== "published") {
      updates.publishedAt = new Date();
    }
    if (body.contentRating === "mature") {
      updates.isNsfw = true;
    }

    db.update(characters)
      .set(updates)
      .where(eq(characters.id, existing.id))
      .run();

    if (body.tags && Array.isArray(body.tags)) {
      // Replace tags
      db.delete(characterTags)
        .where(eq(characterTags.characterId, existing.id))
        .run();
      for (const tagName of body.tags) {
        const tagSlug = slugify(tagName);
        let tag = db.select().from(tags).where(eq(tags.slug, tagSlug)).get();
        if (!tag) {
          const tagId = randomUUID();
          db.insert(tags)
            .values({ id: tagId, name: tagName.toLowerCase(), slug: tagSlug })
            .run();
          tag = { id: tagId } as typeof tag;
        }
        if (tag) {
          db.insert(characterTags)
            .values({
              id: randomUUID(),
              characterId: existing.id,
              tagId: tag.id,
            })
            .run();
        }
      }
    }

    return NextResponse.json({ success: true, slug: existing.slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = db
    .select()
    .from(characters)
    .where(eq(characters.slug, params.slug))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.creatorId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.update(characters)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(characters.id, existing.id))
    .run();

  return NextResponse.json({ success: true });
}
