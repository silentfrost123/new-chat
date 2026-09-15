import { db } from "@/lib/db";
import {
  characters,
  users,
  categories,
  tags,
  characterTags,
  likes,
  favorites,
} from "@/lib/db/schema";
import { eq, and, desc, asc, sql, like, or, inArray } from "drizzle-orm";

export type CharacterWithMeta = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  contentRating: string;
  likeCount: number;
  favoriteCount: number;
  chatCount: number;
  viewCount: number;
  trendingScore: number;
  isFeatured: boolean;
  isNsfw: boolean;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  creator: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  tags: { id: string; name: string; slug: string }[];
  isLiked?: boolean;
  isFavorited?: boolean;
};

export function getCharacterBySlug(slug: string, userId?: string) {
  const char = db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      shortDescription: characters.shortDescription,
      description: characters.description,
      personality: characters.personality,
      backstory: characters.backstory,
      scenario: characters.scenario,
      greeting: characters.greeting,
      exampleDialogue: characters.exampleDialogue,
      speakingStyle: characters.speakingStyle,
      goals: characters.goals,
      traits: characters.traits,
      likes: characters.likes,
      dislikes: characters.dislikes,
      knowledge: characters.knowledge,
      avatarUrl: characters.avatarUrl,
      coverUrl: characters.coverUrl,
      contentRating: characters.contentRating,
      likeCount: characters.likeCount,
      favoriteCount: characters.favoriteCount,
      chatCount: characters.chatCount,
      messageCount: characters.messageCount,
      viewCount: characters.viewCount,
      trendingScore: characters.trendingScore,
      isFeatured: characters.isFeatured,
      isNsfw: characters.isNsfw,
      status: characters.status,
      visibility: characters.visibility,
      publishedAt: characters.publishedAt,
      createdAt: characters.createdAt,
      creatorId: characters.creatorId,
      categoryId: characters.categoryId,
      creatorName: users.name,
      creatorUsername: users.username,
      creatorImage: users.image,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(characters)
    .leftJoin(users, eq(characters.creatorId, users.id))
    .leftJoin(categories, eq(characters.categoryId, categories.id))
    .where(eq(characters.slug, slug))
    .get();

  if (!char) return null;

  const charTags = db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(characterTags)
    .innerJoin(tags, eq(characterTags.tagId, tags.id))
    .where(eq(characterTags.characterId, char.id))
    .all();

  let isLiked = false;
  let isFavorited = false;
  if (userId) {
    isLiked = !!db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.characterId, char.id)))
      .get();
    isFavorited = !!db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.characterId, char.id)))
      .get();
  }

  return {
    ...char,
    creator: {
      id: char.creatorId,
      name: char.creatorName,
      username: char.creatorUsername,
      image: char.creatorImage,
    },
    category: char.categoryId
      ? {
          id: char.categoryId,
          name: char.categoryName!,
          slug: char.categorySlug!,
          icon: char.categoryIcon,
          color: char.categoryColor,
        }
      : null,
    tags: charTags,
    isLiked,
    isFavorited,
  };
}

export function listCharacters(opts: {
  sort?: string;
  category?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  creatorId?: string;
  userId?: string;
  contentPreference?: string;
}) {
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;

  const conditions = [
    eq(characters.status, "published"),
    eq(characters.visibility, "public"),
  ];

  if (opts.featured) {
    conditions.push(eq(characters.isFeatured, true));
  }

  if (opts.creatorId) {
    conditions.push(eq(characters.creatorId, opts.creatorId));
  }

  if (opts.category) {
    const cat = db
      .select()
      .from(categories)
      .where(eq(categories.slug, opts.category))
      .get();
    if (cat) conditions.push(eq(characters.categoryId, cat.id));
  }

  if (opts.q) {
    const q = `%${opts.q}%`;
    conditions.push(
      or(
        like(characters.name, q),
        like(characters.shortDescription, q),
        like(characters.description, q)
      )!
    );
  }

  if (opts.contentPreference === "sfw") {
    conditions.push(eq(characters.isNsfw, false));
  }

  let orderBy;
  switch (opts.sort) {
    case "popular":
    case "most-liked":
      orderBy = desc(characters.likeCount);
      break;
    case "most-chatted":
      orderBy = desc(characters.chatCount);
      break;
    case "new":
    case "newest":
    case "recently-added":
      orderBy = desc(characters.publishedAt);
      break;
    case "name":
      orderBy = asc(characters.name);
      break;
    case "trending":
    default:
      orderBy = desc(characters.trendingScore);
  }

  let results = db
    .select({
      id: characters.id,
      slug: characters.slug,
      name: characters.name,
      shortDescription: characters.shortDescription,
      description: characters.description,
      avatarUrl: characters.avatarUrl,
      coverUrl: characters.coverUrl,
      contentRating: characters.contentRating,
      likeCount: characters.likeCount,
      favoriteCount: characters.favoriteCount,
      chatCount: characters.chatCount,
      viewCount: characters.viewCount,
      trendingScore: characters.trendingScore,
      isFeatured: characters.isFeatured,
      isNsfw: characters.isNsfw,
      status: characters.status,
      publishedAt: characters.publishedAt,
      createdAt: characters.createdAt,
      creatorId: characters.creatorId,
      categoryId: characters.categoryId,
      creatorName: users.name,
      creatorUsername: users.username,
      creatorImage: users.image,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(characters)
    .leftJoin(users, eq(characters.creatorId, users.id))
    .leftJoin(categories, eq(characters.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset)
    .all();

  if (opts.tag) {
    const tag = db.select().from(tags).where(eq(tags.slug, opts.tag)).get();
    if (tag) {
      const taggedIds = db
        .select({ characterId: characterTags.characterId })
        .from(characterTags)
        .where(eq(characterTags.tagId, tag.id))
        .all()
        .map((r) => r.characterId);
      results = results.filter((r) => taggedIds.includes(r.id));
    }
  }

  const charIds = results.map((r) => r.id);
  const allTags =
    charIds.length > 0
      ? db
          .select({
            characterId: characterTags.characterId,
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
          })
          .from(characterTags)
          .innerJoin(tags, eq(characterTags.tagId, tags.id))
          .where(inArray(characterTags.characterId, charIds))
          .all()
      : [];

  const tagsByChar = allTags.reduce(
    (acc, t) => {
      if (!acc[t.characterId]) acc[t.characterId] = [];
      acc[t.characterId].push({ id: t.id, name: t.name, slug: t.slug });
      return acc;
    },
    {} as Record<string, { id: string; name: string; slug: string }[]>
  );

  return results.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortDescription: r.shortDescription,
    description: r.description,
    avatarUrl: r.avatarUrl,
    coverUrl: r.coverUrl,
    contentRating: r.contentRating,
    likeCount: r.likeCount,
    favoriteCount: r.favoriteCount,
    chatCount: r.chatCount,
    viewCount: r.viewCount,
    trendingScore: r.trendingScore,
    isFeatured: r.isFeatured,
    isNsfw: r.isNsfw,
    status: r.status,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    creator: {
      id: r.creatorId,
      name: r.creatorName,
      username: r.creatorUsername,
      image: r.creatorImage,
    },
    category: r.categoryId
      ? {
          id: r.categoryId,
          name: r.categoryName!,
          slug: r.categorySlug!,
          icon: r.categoryIcon,
          color: r.categoryColor,
        }
      : null,
    tags: tagsByChar[r.id] || [],
  }));
}

export function getCategories() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder))
    .all();
}

export function getPopularTags(limit = 30) {
  return db.select().from(tags).orderBy(desc(tags.usageCount)).limit(limit).all();
}

export function incrementView(characterId: string) {
  db.update(characters)
    .set({ viewCount: sql`${characters.viewCount} + 1` })
    .where(eq(characters.id, characterId))
    .run();
}
