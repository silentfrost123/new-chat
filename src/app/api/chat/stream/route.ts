import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  conversations,
  characters,
  messages,
  memories,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { streamAIResponse } from "@/lib/ai/provider";
import { checkUsageLimit, recordUsage } from "@/lib/usage";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Please log in to chat" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    conversationId: string;
    content: string;
    regenerate?: boolean;
    messageId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { conversationId, content, regenerate, messageId } = body;

  if (!conversationId || (!content?.trim() && !regenerate)) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Usage check
  const usage = await checkUsageLimit(session.user.id);
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({ error: usage.message, code: "USAGE_LIMIT" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const conv = db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .get();

  if (!conv || conv.userId !== session.user.id) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const character = db
    .select()
    .from(characters)
    .where(eq(characters.id, conv.characterId))
    .get();

  if (!character) {
    return new Response(
      JSON.stringify({ error: "The character is temporarily unavailable." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const user = db.select().from(users).where(eq(users.id, session.user.id)).get();
  const userMessageId = randomUUID();
  const assistantMessageId = randomUUID();
  const siblingGroupId = regenerate ? randomUUID() : null;
  let generationIndex = 0;

  // Save user message (unless regenerating)
  if (!regenerate && content?.trim()) {
    // Basic content moderation
    const blocked = moderateContent(content);
    if (blocked) {
      return new Response(
        JSON.stringify({ error: blocked }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    db.insert(messages)
      .values({
        id: userMessageId,
        conversationId,
        role: "user",
        content: content.trim(),
      })
      .run();
  }

  // If regenerating, find parent and set sibling group
  if (regenerate && messageId) {
    const original = db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .get();
    if (original) {
      const groupId = original.siblingGroupId || original.id;
      // Update original to have sibling group
      if (!original.siblingGroupId) {
        db.update(messages)
          .set({ siblingGroupId: groupId })
          .where(eq(messages.id, original.id))
          .run();
      }
      const siblings = db
        .select()
        .from(messages)
        .where(eq(messages.siblingGroupId, groupId))
        .all();
      generationIndex = siblings.length;
    }
  }

  // Load history
  const history = db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      )
    )
    .orderBy(asc(messages.createdAt))
    .limit(50)
    .all();

  // Load memories
  const userMemories =
    user?.memoryEnabled !== false
      ? db
          .select()
          .from(memories)
          .where(
            and(
              eq(memories.userId, session.user.id),
              eq(memories.isActive, true),
              eq(memories.characterId, character.id)
            )
          )
          .orderBy(desc(memories.importance))
          .limit(20)
          .all()
      : [];

  const encoder = new TextEncoder();
  const startTime = Date.now();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send("start", {
          messageId: assistantMessageId,
          userMessageId: regenerate ? undefined : userMessageId,
          generationIndex,
        });

        const generator = streamAIResponse(
          {
            character,
            messages: history,
            memories: userMemories,
            userName: user?.name || user?.username || undefined,
          },
          { signal: req.signal }
        );

        for await (const chunk of generator) {
          fullContent += chunk;
          send("token", { content: chunk });
        }

        // Save assistant message
        db.insert(messages)
          .values({
            id: assistantMessageId,
            conversationId,
            role: "assistant",
            content: fullContent,
            model: process.env.MOCK_AI === "true" ? "mock-stream" : "default",
            tokenCount: Math.ceil(fullContent.length / 4),
            generationIndex,
            siblingGroupId: siblingGroupId || undefined,
          })
          .run();

        // Update conversation
        const preview = fullContent.slice(0, 120);
        db.update(conversations)
          .set({
            lastMessageAt: new Date(),
            lastMessagePreview: preview,
            messageCount: sql`${conversations.messageCount} + ${regenerate ? 1 : 2}`,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId))
          .run();

        // Update character message count
        db.update(characters)
          .set({
            messageCount: sql`${characters.messageCount} + 1`,
          })
          .where(eq(characters.id, character.id))
          .run();

        // Record usage
        recordUsage({
          userId: session.user.id,
          conversationId,
          characterId: character.id,
          type: "message",
          model: process.env.MOCK_AI === "true" ? "mock-stream" : "default",
          tokensOut: Math.ceil(fullContent.length / 4),
          durationMs: Date.now() - startTime,
        });

        send("done", {
          messageId: assistantMessageId,
          content: fullContent,
          remaining: usage.remaining - 1,
        });
      } catch (err) {
        console.error("Stream error:", err);
        if (fullContent) {
          // Save partial
          db.insert(messages)
            .values({
              id: assistantMessageId,
              conversationId,
              role: "assistant",
              content: fullContent + "\n\n*[Generation interrupted]*",
              model: "interrupted",
            })
            .run();
        }
        send("error", {
          error: "Your generation was interrupted. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function moderateContent(text: string): string | null {
  const lower = text.toLowerCase();
  // Block clear CSAM / exploitation patterns
  const blockedPatterns = [
    /\b(child|minor|underage|preteen|loli|shota).{0,30}(sex|porn|nude|naked)/i,
    /\b(sex|porn|nude).{0,30}(child|minor|underage|preteen)/i,
  ];
  for (const p of blockedPatterns) {
    if (p.test(lower)) {
      return "This message violates our community guidelines and cannot be sent.";
    }
  }
  return null;
}
