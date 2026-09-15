import Link from "next/link";
import { MessageCircle, Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatNumber, getInitials, cn } from "@/lib/utils";

export interface CharacterCardData {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  avatarUrl?: string | null;
  contentRating?: string;
  likeCount?: number;
  favoriteCount?: number;
  chatCount?: number;
  isFeatured?: boolean;
  isNsfw?: boolean;
  creator?: {
    username?: string | null;
    name?: string | null;
  };
  category?: {
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
  tags?: { name: string; slug: string }[];
}

const gradients = [
  "from-violet-600 via-purple-600 to-indigo-700",
  "from-blue-600 via-cyan-600 to-teal-700",
  "from-rose-600 via-pink-600 to-fuchsia-700",
  "from-amber-600 via-orange-600 to-red-700",
  "from-emerald-600 via-green-600 to-teal-700",
  "from-slate-600 via-blue-700 to-indigo-800",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function CharacterCard({
  character,
  className,
}: {
  character: CharacterCardData;
  className?: string;
}) {
  const gradient = gradientFor(character.name);

  return (
    <Link
      href={`/character/${character.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-vellum-500/40 hover:shadow-glow hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* Artwork */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            gradient
          )}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-150" />
            <Avatar className="h-24 w-24 ring-4 ring-white/20 shadow-xl transition-transform duration-300 group-hover:scale-110">
              {character.avatarUrl && (
                <AvatarImage src={character.avatarUrl} alt={character.name} />
              )}
              <AvatarFallback
                className={cn(
                  "text-2xl font-bold bg-gradient-to-br text-white",
                  gradient
                )}
              >
                {getInitials(character.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {character.isFeatured && (
            <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-white text-[10px]">
              <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
              Featured
            </Badge>
          )}
          {character.contentRating === "mature" && (
            <Badge variant="mature" className="text-[10px] backdrop-blur-md">
              Mature
            </Badge>
          )}
          {character.contentRating === "suggestive" && (
            <Badge variant="warning" className="text-[10px] backdrop-blur-md">
              16+
            </Badge>
          )}
        </div>

        {character.category && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-black/40 backdrop-blur-md border-white/10 text-white text-[10px]">
              {character.category.icon} {character.category.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground group-hover:text-vellum-300 transition-colors line-clamp-1">
          {character.name}
        </h3>
        {character.creator?.username && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            by @{character.creator.username}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
          {character.shortDescription}
        </p>

        {character.tags && character.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {character.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.slug}
                className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span className="flex items-center gap-1" title="Chats">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatNumber(character.chatCount || 0)}
          </span>
          <span className="flex items-center gap-1" title="Likes">
            <Heart className="h-3.5 w-3.5" />
            {formatNumber(character.likeCount || 0)}
          </span>
          {(character.favoriteCount || 0) > 0 && (
            <span className="flex items-center gap-1" title="Favorites">
              <Star className="h-3.5 w-3.5" />
              {formatNumber(character.favoriteCount || 0)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CharacterCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
