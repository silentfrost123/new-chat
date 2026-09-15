import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { memories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characterId = req.nextUrl.searchParams.get("characterId");
  const conditions = [eq(memories.userId, session.user.id)];
  if (characterId) conditions.push(eq(memories.characterId, characterId));

  const list = db
    .select()
    .from(memories)
    .where(and(...conditions))
    .orderBy(desc(memories.updatedAt))
    .all();

  return NextResponse.json({ memories: list });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const id = randomUUID();
  db.insert(memories)
    .values({
      id,
      userId: session.user.id,
      characterId: body.characterId,
      conversationId: body.conversationId,
      type: body.type || "user",
      key: body.key,
      content: body.content.trim(),
      importance: body.importance || 5,
    })
    .run();

  return NextResponse.json({ id, success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const existing = db
    .select()
    .from(memories)
    .where(and(eq(memories.id, body.id), eq(memories.userId, session.user.id)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.content !== undefined) updates.content = body.content;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.importance !== undefined) updates.importance = body.importance;
  if (body.key !== undefined) updates.key = body.key;

  db.update(memories).set(updates).where(eq(memories.id, body.id)).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  db.delete(memories)
    .where(and(eq(memories.id, id), eq(memories.userId, session.user.id)))
    .run();

  return NextResponse.json({ success: true });
}
