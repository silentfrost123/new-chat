"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
  { value: "most-chatted", label: "Most chatted" },
  { value: "most-liked", label: "Most liked" },
  { value: "newest", label: "New" },
  { value: "featured", label: "Featured" },
];

export function DiscoverFilters({
  categories,
  tags,
  currentSort,
  currentCategory,
  currentTag,
  currentQuery,
}: {
  categories: { slug: string; name: string; icon: string | null }[];
  tags: { slug: string; name: string }[];
  currentSort: string;
  currentCategory?: string;
  currentTag?: string;
  currentQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(currentQuery || "");

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "q" && key !== "sort") {
      // keep others
    }
    router.push(`/discover?${params.toString()}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update("q", q.trim() || null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, description..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {(currentQuery || currentCategory || currentTag) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/discover")}
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Sort pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => update("sort", s.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              currentSort === s.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => update("category", null)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            !currentCategory
              ? "border-vellum-500/50 bg-vellum-500/15 text-vellum-300"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() =>
              update("category", currentCategory === c.slug ? null : c.slug)
            }
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              currentCategory === c.slug
                ? "border-vellum-500/50 bg-vellum-500/15 text-vellum-300"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((t) => (
            <button
              key={t.slug}
              onClick={() => update("tag", currentTag === t.slug ? null : t.slug)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] transition-colors",
                currentTag === t.slug
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
