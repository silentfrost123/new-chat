import { listCharacters, getPopularTags } from "@/lib/characters";
import { CharacterCard } from "@/components/characters/character-card";
import { SearchForm } from "./search-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search AI characters on Vellum by name, description, tags, and more.",
};

export const dynamic = "force-dynamic";

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const q = searchParams.q || "";
  const sort = searchParams.sort || "relevance";
  const results = q
    ? listCharacters({
        q,
        sort: sort === "relevance" ? "trending" : sort,
        limit: 48,
      })
    : [];
  const popularTags = getPopularTags(16);
  const popularQueries = [
    "detective",
    "fantasy",
    "mentor",
    "scientist",
    "bookstore",
    "adventure",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Search</h1>
      <SearchForm initialQuery={q} initialSort={sort} />

      {!q && (
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Popular searches
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularQueries.map((pq) => (
                <a
                  key={pq}
                  href={`/search?q=${encodeURIComponent(pq)}`}
                  className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  {pq}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Popular tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((t) => (
                <a
                  key={t.slug}
                  href={`/discover?tag=${t.slug}`}
                  className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  #{t.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {q && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          </p>
          {results.length === 0 ? (
            <p className="text-center py-16 text-muted-foreground">
              No characters matched your search. Try different keywords.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {results.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
