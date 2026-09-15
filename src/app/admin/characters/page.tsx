import { db } from "@/lib/db";
import { characters, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { CharacterModActions } from "./character-mod-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Characters",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCharactersPage() {
  const list = db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      status: characters.status,
      contentRating: characters.contentRating,
      chatCount: characters.chatCount,
      likeCount: characters.likeCount,
      isFeatured: characters.isFeatured,
      creatorName: users.name,
      creatorUsername: users.username,
    })
    .from(characters)
    .leftJoin(users, eq(characters.creatorId, users.id))
    .orderBy(desc(characters.createdAt))
    .limit(100)
    .all();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Characters</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Character</th>
                <th className="p-3 font-medium">Creator</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Rating</th>
                <th className="p-3 font-medium">Stats</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="p-3">
                    <Link
                      href={`/character/${c.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    {c.isFeatured && (
                      <span className="ml-2 text-[10px] text-amber-400">FEATURED</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    @{c.creatorUsername}
                  </td>
                  <td className="p-3 capitalize">{c.status}</td>
                  <td className="p-3 capitalize">{c.contentRating}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.chatCount} chats · {c.likeCount} likes
                  </td>
                  <td className="p-3">
                    <CharacterModActions
                      characterId={c.id}
                      status={c.status}
                      isFeatured={!!c.isFeatured}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
