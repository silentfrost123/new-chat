import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, characters } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { formatRelativeTime, getInitials, truncate } from "@/lib/utils";
import { ConversationActions } from "./conversation-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chats",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/chats");
  }

  const list = db
    .select({
      id: conversations.id,
      title: conversations.title,
      isPinned: conversations.isPinned,
      lastMessageAt: conversations.lastMessageAt,
      lastMessagePreview: conversations.lastMessagePreview,
      messageCount: conversations.messageCount,
      characterName: characters.name,
      characterSlug: characters.slug,
      characterAvatar: characters.avatarUrl,
    })
    .from(conversations)
    .innerJoin(characters, eq(conversations.characterId, characters.id))
    .where(
      and(
        eq(conversations.userId, session.user.id),
        eq(conversations.isArchived, false)
      )
    )
    .orderBy(desc(conversations.isPinned), desc(conversations.lastMessageAt))
    .all();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Chats</h1>
          <p className="mt-1 text-muted-foreground">
            Continue your conversations
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/discover">
            <Plus className="h-4 w-4" /> New chat
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover a character and start chatting
          </p>
          <Button asChild variant="gradient" className="mt-6">
            <Link href="/discover">Explore characters</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 hover:border-vellum-500/30 hover:bg-card transition-all"
            >
              <Link
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  {c.characterAvatar && (
                    <AvatarImage src={c.characterAvatar} alt="" />
                  )}
                  <AvatarFallback>
                    {getInitials(c.characterName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {c.title || c.characterName}
                    </p>
                    {c.isPinned && (
                      <span className="text-[10px] text-vellum-400">PINNED</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {c.lastMessagePreview
                      ? truncate(c.lastMessagePreview, 80)
                      : "No messages yet"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                  {formatRelativeTime(c.lastMessageAt)}
                </span>
              </Link>
              <ConversationActions id={c.id} title={c.title || c.characterName} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
