import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { users, follows, characters } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { listCharacters } from "@/lib/characters";
import { CharacterCard } from "@/components/characters/character-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials, absoluteUrl, formatNumber } from "@/lib/utils";
import { FollowButton } from "./follow-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, params.username))
    .get();
  if (!user) return { title: "User not found" };
  return {
    title: user.name || user.username || "Profile",
    description: user.bio || `${user.name}'s profile on Vellum`,
    openGraph: {
      title: `${user.name} · Vellum`,
      description: user.bio || undefined,
      url: absoluteUrl(`/profile/${user.username}`),
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const session = await getSession();
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, params.username))
    .get();

  if (!user || user.isBanned) notFound();

  const followerCount =
    db
      .select({ c: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, user.id))
      .get()?.c || 0;

  const followingCount =
    db
      .select({ c: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, user.id))
      .get()?.c || 0;

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    isFollowing = !!db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, session.user.id),
          eq(follows.followingId, user.id)
        )
      )
      .get();
  }

  const created = listCharacters({ creatorId: user.id, limit: 24 });
  const isOwn = session?.user?.id === user.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-border bg-card/50 p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 ring-4 ring-border">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="text-2xl">
              {getInitials(user.name || user.username || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold">
                {user.name || user.username}
              </h1>
              {user.role === "admin" && <Badge>Admin</Badge>}
              {user.role === "creator" && <Badge variant="secondary">Creator</Badge>}
              {user.plan !== "free" && (
                <Badge variant="outline" className="capitalize">
                  {user.plan}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{user.username}</p>
            {user.bio && (
              <p className="mt-3 text-sm leading-relaxed max-w-xl">{user.bio}</p>
            )}

            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <span className="font-semibold">{formatNumber(Number(followerCount))}</span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="font-semibold">{formatNumber(Number(followingCount))}</span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
              <div>
                <span className="font-semibold">{created.length}</span>{" "}
                <span className="text-muted-foreground">characters</span>
              </div>
            </div>

            <div className="mt-5">
              {isOwn ? (
                <Link
                  href="/settings"
                  className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  userId={user.id}
                  isFollowing={isFollowing}
                  isLoggedIn={!!session?.user}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-6">Characters</h2>
        {created.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No public characters yet
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {created.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
