import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { follows, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Following",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/following");

  const list = db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      bio: users.bio,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, session.user.id))
    .all();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Following</h1>
      <p className="mt-1 text-muted-foreground">Creators you follow</p>

      {list.length === 0 ? (
        <div className="mt-16 text-center py-16 rounded-2xl border border-dashed border-border">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">Not following anyone yet</p>
          <Button asChild variant="gradient" className="mt-6">
            <Link href="/discover">Discover creators</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {list.map((u) => (
            <Link
              key={u.id}
              href={`/profile/${u.username}`}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-4 hover:border-vellum-500/30 transition-all"
            >
              <Avatar className="h-12 w-12">
                {u.image && <AvatarImage src={u.image} alt="" />}
                <AvatarFallback>{getInitials(u.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
                {u.bio && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {u.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
