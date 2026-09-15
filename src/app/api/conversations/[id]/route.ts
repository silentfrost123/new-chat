import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, characters, messages, users } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conv = db
    .select({
      id: conversations.id,
      title: conversations.title,
      isArchived: conversations.isArchived,
      isPinned: conversations.isPinned,
      messageCount: conversations.messageCount,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
      userId: conversations.userId,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterAvatar: characters.avatarUrl,
      characterGreeting: characters.greeting,
      characterShortDescription: characters.shortDescription,
      characterPersonality: characters.personality,
      characterDescription: characters.description,
      characterScenario: characters.scenario,
      characterContentRating: characters.contentRating,
      creatorUsername: users.username,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .leftJoin(users, eq(characters.creatorId, users.id))
    .where(eq(conversations.id, params.id))
    .get();

  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (conv.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);
  const before = req.nextUrl.searchParams.get("before");

  let msgList = db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, params.id),
        eq(messages.isDeleted, false)
      )
    )
    .orderBy(asc(messages.createdAt))
    .limit(limit)
    .all();

  // Group siblings for branch UI
  const siblingGroups = new Map<string, typeof msgList>();
  for (const m of msgList) {
    if (m.siblingGroupId) {
      const group = siblingGroups.get(m.siblingGroupId) || [];
      group.push(m);
      siblingGroups.set(m.siblingGroupId, group);
    }
  }

  return NextResponse.json({
    conversation: {
      id: conv.id,
      title: conv.title,
      isArchived: conv.isArchived,
      isPinned: conv.isPinned,
      messageCount: conv.messageCount,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
      character: {
        id: conv.characterId,
        name: conv.characterName,
        slug: conv.characterSlug,
        avatarUrl: conv.characterAvatar,
        greeting: conv.characterGreeting,
        shortDescription: conv.characterShortDescription,
        personality: conv.characterPersonality,
        description: conv.characterDescription,
        scenario: conv.characterScenario,
        contentRating: conv.characterContentRating,
        creatorUsername: conv.creatorUsername,
      },
    },
    messages: msgList.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      isEdited: m.isEdited,
      generationIndex: m.generationIndex,
      siblingGroupId: m.siblingGroupId,
      siblingCount: m.siblingGroupId
        ? siblingGroups.get(m.siblingGroupId)?.length || 1
        : 1,
      rating: m.rating,
      model: m.model,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conv = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.id))
    .get();

  if (!conv || conv.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.title === "string") updates.title = body.title.slice(0, 100);
  if (typeof body.isArchived === "boolean") updates.isArchived = body.isArchived;
  if (typeof body.isPinned === "boolean") updates.isPinned = body.isPinned;

  db.update(conversations).set(updates).where(eq(conversations.id, params.id)).run();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conv = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.id))
    .get();

  if (!conv || (conv.userId !== session.user.id && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.delete(messages).where(eq(messages.conversationId, params.id)).run();
  db.delete(conversations).where(eq(conversations.id, params.id)).run();

  return NextResponse.json({ success: true });
}
