import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  conversations,
  characters,
  messages,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archived = req.nextUrl.searchParams.get("archived") === "true";

  const list = db
    .select({
      id: conversations.id,
      title: conversations.title,
      isArchived: conversations.isArchived,
      isPinned: conversations.isPinned,
      lastMessageAt: conversations.lastMessageAt,
      lastMessagePreview: conversations.lastMessagePreview,
      messageCount: conversations.messageCount,
      createdAt: conversations.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterAvatar: characters.avatarUrl,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .where(
      and(
        eq(conversations.userId, session.user.id),
        eq(conversations.isArchived, archived)
      )
    )
    .orderBy(desc(conversations.isPinned), desc(conversations.lastMessageAt))
    .all();

  return NextResponse.json({
    conversations: list.map((c) => ({
      id: c.id,
      title: c.title || c.characterName,
      isArchived: c.isArchived,
      isPinned: c.isPinned,
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: c.lastMessagePreview,
      messageCount: c.messageCount,
      createdAt: c.createdAt,
      character: {
        id: c.characterId,
        name: c.characterName,
        slug: c.characterSlug,
        avatarUrl: c.characterAvatar,
      },
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to start a chat" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { characterId, characterSlug } = body;

    let character;
    if (characterId) {
      character = db
        .select()
        .from(characters)
        .where(eq(characters.id, characterId))
        .get();
    } else if (characterSlug) {
      character = db
        .select()
        .from(characters)
        .where(eq(characters.slug, characterSlug))
        .get();
    }

    if (!character || character.status === "deleted") {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    if (character.status !== "published" && character.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Character is not available" },
        { status: 404 }
      );
    }

    const id = randomUUID();
    const now = new Date();

    db.insert(conversations)
      .values({
        id,
        userId: session.user.id,
        characterId: character.id,
        title: character.name,
        lastMessageAt: now,
        lastMessagePreview: character.greeting?.slice(0, 100),
        messageCount: 1,
      })
      .run();

    // Insert greeting as first assistant message
    if (character.greeting) {
      db.insert(messages)
        .values({
          id: randomUUID(),
          conversationId: id,
          role: "assistant",
          content: character.greeting,
        })
        .run();
    }

    // Bump chat count
    db.update(characters)
      .set({ chatCount: sql`${characters.chatCount} + 1` })
      .where(eq(characters.id, character.id))
      .run();

    return NextResponse.json({ id, characterSlug: character.slug });
  } catch (e) {
    console.error("Create conversation error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
