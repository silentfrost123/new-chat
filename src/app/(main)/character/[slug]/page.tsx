import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  MessageCircle,
  Heart,
  Star,
  Share2,
  Flag,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { getCharacterBySlug, incrementView, listCharacters } from "@/lib/characters";
import { getSession } from "@/lib/auth";
import { CharacterCard } from "@/components/characters/character-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatNumber, getInitials, absoluteUrl } from "@/lib/utils";
import { StartChatButton } from "./start-chat-button";
import { CharacterActions } from "./character-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const character = getCharacterBySlug(params.slug);
  if (!character) return { title: "Character not found" };

  return {
    title: character.name,
    description: character.shortDescription,
    openGraph: {
      title: `${character.name} · Vellum`,
      description: character.shortDescription,
      url: absoluteUrl(`/character/${character.slug}`),
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: character.name,
      description: character.shortDescription,
    },
  };
}

export default async function CharacterPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  const character = getCharacterBySlug(params.slug, session?.user?.id);

  if (!character || character.status === "deleted") {
    notFound();
  }

  if (
    character.status !== "published" &&
    character.creator.id !== session?.user?.id &&
    session?.user?.role !== "admin"
  ) {
    notFound();
  }

  incrementView(character.id);

  const related = listCharacters({
    category: character.category?.slug,
    limit: 4,
  }).filter((c) => c.id !== character.id);

  const traits: string[] = (() => {
    try {
      return character.traits ? JSON.parse(character.traits as string) : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to discover
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <div>
          {/* Hero banner */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-vellum-900/80 via-card to-pink-950/40 p-8 sm:p-10">
            <div className="absolute inset-0 bg-card-glow" />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-white/10 shadow-xl shrink-0">
                {character.avatarUrl && (
                  <AvatarImage src={character.avatarUrl} alt={character.name} />
                )}
                <AvatarFallback className="text-3xl">
                  {getInitials(character.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {character.isFeatured && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                    </Badge>
                  )}
                  {character.contentRating !== "safe" && (
                    <Badge
                      variant={
                        character.contentRating === "mature" ? "mature" : "warning"
                      }
                    >
                      {character.contentRating === "mature" ? "Mature" : "16+"}
                    </Badge>
                  )}
                  {character.category && (
                    <Badge variant="secondary">
                      {character.category.icon} {character.category.name}
                    </Badge>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl font-bold">
                  {character.name}
                </h1>
                <p className="mt-2 text-muted-foreground text-lg">
                  {character.shortDescription}
                </p>

                {character.creator.username && (
                  <Link
                    href={`/profile/${character.creator.username}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Avatar className="h-6 w-6">
                      {character.creator.image && (
                        <AvatarImage src={character.creator.image} alt="" />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(character.creator.name || "C")}
                      </AvatarFallback>
                    </Avatar>
                    by @{character.creator.username}
                  </Link>
                )}

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    {formatNumber(character.chatCount)} chats
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" />
                    {formatNumber(character.likeCount)} likes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4" />
                    {formatNumber(character.favoriteCount)} favorites
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {formatNumber(character.viewCount)} views
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
              <StartChatButton
                characterId={character.id}
                characterSlug={character.slug}
                isLoggedIn={!!session?.user}
              />
              <CharacterActions
                characterId={character.id}
                slug={character.slug}
                isLiked={character.isLiked}
                isFavorited={character.isFavorited}
                isLoggedIn={!!session?.user}
              />
            </div>
          </div>

          {/* Details */}
          <div className="mt-8 space-y-8">
            <Section title="About">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {character.description}
              </p>
            </Section>

            {character.personality && (
              <Section title="Personality">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {character.personality}
                </p>
              </Section>
            )}

            {character.scenario && (
              <Section title="Scenario">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {character.scenario}
                </p>
              </Section>
            )}

            {character.greeting && (
              <Section title="Greeting">
                <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-relaxed whitespace-pre-wrap">
                  {character.greeting}
                </div>
              </Section>
            )}

            {character.exampleDialogue && (
              <Section title="Example conversation">
                <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {character.exampleDialogue}
                </div>
              </Section>
            )}

            {traits.length > 0 && (
              <Section title="Traits">
                <div className="flex flex-wrap gap-2">
                  {traits.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}

            {character.tags.length > 0 && (
              <Section title="Tags">
                <div className="flex flex-wrap gap-2">
                  {character.tags.map((t) => (
                    <Link key={t.slug} href={`/discover?tag=${t.slug}`}>
                      <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                        #{t.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-20">
            <h3 className="font-semibold mb-4">Quick start</h3>
            <StartChatButton
              characterId={character.id}
              characterSlug={character.slug}
              isLoggedIn={!!session?.user}
              fullWidth
            />
            <Separator className="my-4" />
            <dl className="space-y-3 text-sm">
              {character.speakingStyle && (
                <div>
                  <dt className="text-muted-foreground">Speaking style</dt>
                  <dd className="mt-0.5">{character.speakingStyle}</dd>
                </div>
              )}
              {(character as { likes?: string }).likes && (
                <div>
                  <dt className="text-muted-foreground">Likes</dt>
                  <dd className="mt-0.5">{(character as { likes?: string }).likes}</dd>
                </div>
              )}
              {(character as { dislikes?: string }).dislikes && (
                <div>
                  <dt className="text-muted-foreground">Dislikes</dt>
                  <dd className="mt-0.5">
                    {(character as { dislikes?: string }).dislikes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">Similar characters</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: character.name,
            description: character.shortDescription,
            url: absoluteUrl(`/character/${character.slug}`),
          }),
        }}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
