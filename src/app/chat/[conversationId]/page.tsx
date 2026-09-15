import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, characters, messages, users } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Chat",
  robots: { index: false, follow: false },
};

export default async function ChatPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/chat/${params.conversationId}`);
  }

  const conv = db
    .select({
      id: conversations.id,
      title: conversations.title,
      userId: conversations.userId,
      characterId: characters.id,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterAvatar: characters.avatarUrl,
      characterShortDescription: characters.shortDescription,
      characterPersonality: characters.personality,
      characterScenario: characters.scenario,
      characterContentRating: characters.contentRating,
      creatorUsername: users.username,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .leftJoin(users, eq(characters.creatorId, users.id))
    .where(eq(conversations.id, params.conversationId))
    .get();

  if (!conv) notFound();
  if (conv.userId !== session.user.id && session.user.role !== "admin") {
    redirect("/chats");
  }

  const msgList = db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, params.conversationId),
        eq(messages.isDeleted, false)
      )
    )
    .orderBy(asc(messages.createdAt))
    .limit(200)
    .all();

  // Conversation list for sidebar
  const allConvs = db
    .select({
      id: conversations.id,
      title: conversations.title,
      lastMessageAt: conversations.lastMessageAt,
      lastMessagePreview: conversations.lastMessagePreview,
      characterName: characters.name,
      characterAvatar: characters.avatarUrl,
      characterSlug: characters.slug,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .where(
      and(
        eq(conversations.userId, session.user.id),
        eq(conversations.isArchived, false)
      )
    )
    .orderBy(asc(conversations.lastMessageAt))
    .all()
    .reverse()
    .slice(0, 50);

  return (
    <ChatInterface
      conversation={{
        id: conv.id,
        title: conv.title || conv.characterName,
        character: {
          id: conv.characterId,
          name: conv.characterName,
          slug: conv.characterSlug,
          avatarUrl: conv.characterAvatar,
          shortDescription: conv.characterShortDescription,
          personality: conv.characterPersonality,
          scenario: conv.characterScenario,
          contentRating: conv.characterContentRating,
          creatorUsername: conv.creatorUsername,
        },
      }}
      initialMessages={msgList.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        createdAt: m.createdAt,
        isEdited: m.isEdited,
        generationIndex: m.generationIndex,
        siblingGroupId: m.siblingGroupId,
        rating: m.rating,
      }))}
      conversationList={allConvs.map((c) => ({
        id: c.id,
        title: c.title || c.characterName,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        characterName: c.characterName,
        characterAvatar: c.characterAvatar,
        characterSlug: c.characterSlug,
      }))}
      userName={session.user.name || session.user.username || "You"}
    />
  );
}
