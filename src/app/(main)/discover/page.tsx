import { Suspense } from "react";
import { listCharacters, getCategories, getPopularTags } from "@/lib/characters";
import { CharacterCard, CharacterCardSkeleton } from "@/components/characters/character-card";
import { DiscoverFilters } from "./filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Characters",
  description: "Browse trending, popular, and new AI characters on Vellum.",
};

export const dynamic = "force-dynamic";

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const sort = searchParams.sort || "trending";
  const category = searchParams.category;
  const tag = searchParams.tag;
  const q = searchParams.q;

  const characters = listCharacters({
    sort,
    category,
    tag,
    q,
    featured: sort === "featured",
    limit: 48,
  });
  const categories = getCategories();
  const tags = getPopularTags(20);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-muted-foreground">
          Find your next conversation among thousands of characters
        </p>
      </div>

      <Suspense fallback={null}>
        <DiscoverFilters
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            icon: c.icon,
          }))}
          tags={tags.map((t) => ({ slug: t.slug, name: t.name }))}
          currentSort={sort}
          currentCategory={category}
          currentTag={tag}
          currentQuery={q}
        />
      </Suspense>

      {characters.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">No characters found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  );
}
