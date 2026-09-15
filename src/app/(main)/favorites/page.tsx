import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { favorites, characters, users, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CharacterCard } from "@/components/characters/character-card";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/favorites");

  const list = db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      shortDescription: characters.shortDescription,
      avatarUrl: characters.avatarUrl,
      contentRating: characters.contentRating,
      likeCount: characters.likeCount,
      favoriteCount: characters.favoriteCount,
      chatCount: characters.chatCount,
      isFeatured: characters.isFeatured,
      creatorUsername: users.username,
      creatorName: users.name,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categorySlug: categories.slug,
      categoryColor: categories.color,
      categoryId: categories.id,
    })
    .from(favorites)
    .innerJoin(characters, eq(favorites.characterId, characters.id))
    .leftJoin(users, eq(characters.creatorId, users.id))
    .leftJoin(categories, eq(characters.categoryId, categories.id))
    .where(eq(favorites.userId, session.user.id))
    .all();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold">Favorites</h1>
      <p className="mt-1 text-muted-foreground">Characters you&apos;ve saved</p>

      {list.length === 0 ? (
        <div className="mt-16 text-center py-16 rounded-2xl border border-dashed border-border">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap the star on any character to save them here
          </p>
          <Button asChild variant="gradient" className="mt-6">
            <Link href="/discover">Discover characters</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {list.map((c) => (
            <CharacterCard
              key={c.id}
              character={{
                id: c.id,
                slug: c.slug,
                name: c.name,
                shortDescription: c.shortDescription,
                avatarUrl: c.avatarUrl,
                contentRating: c.contentRating,
                likeCount: c.likeCount,
                favoriteCount: c.favoriteCount,
                chatCount: c.chatCount,
                isFeatured: c.isFeatured,
                creator: { username: c.creatorUsername, name: c.creatorName },
                category: c.categoryId
                  ? {
                      name: c.categoryName!,
                      icon: c.categoryIcon,
                      color: c.categoryColor,
                    }
                  : null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
