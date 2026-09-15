import { NextRequest, NextResponse } from "next/server";
import { listCharacters, getCategories, getPopularTags } from "@/lib/characters";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters, characterTags, tags } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { slugify } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort") || "trending";
  const category = searchParams.get("category") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const q = searchParams.get("q") || undefined;
  const featured = searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const creatorId = searchParams.get("creatorId") || undefined;

  const results = listCharacters({
    sort,
    category,
    tag,
    q,
    featured,
    limit,
    offset,
    creatorId,
  });

  return NextResponse.json({
    characters: results,
    pagination: { limit, offset, hasMore: results.length === limit },
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  shortDescription: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  personality: z.string().min(1).max(5000),
  backstory: z.string().max(5000).optional(),
  scenario: z.string().max(5000).optional(),
  greeting: z.string().min(1).max(2000),
  exampleDialogue: z.string().max(5000).optional(),
  speakingStyle: z.string().max(1000).optional(),
  goals: z.string().max(1000).optional(),
  traits: z.array(z.string()).optional(),
  likes: z.string().max(1000).optional(),
  dislikes: z.string().max(1000).optional(),
  knowledge: z.string().max(2000).optional(),
  worldInfo: z.string().max(5000).optional(),
  systemInstructions: z.string().max(3000).optional(),
  avatarUrl: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  contentRating: z.enum(["safe", "suggestive", "mature"]).default("safe"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to create characters" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const id = randomUUID();
    let slug = slugify(data.name);

    // Ensure unique slug
    const existing = db.select().from(characters).where(eq(characters.slug, slug)).get();
    if (existing) {
      slug = `${slug}-${randomUUID().slice(0, 6)}`;
    }

    db.insert(characters)
      .values({
        id,
        slug,
        creatorId: session.user.id,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        personality: data.personality,
        backstory: data.backstory,
        scenario: data.scenario,
        greeting: data.greeting,
        exampleDialogue: data.exampleDialogue,
        speakingStyle: data.speakingStyle,
        goals: data.goals,
        traits: data.traits ? JSON.stringify(data.traits) : null,
        likes: data.likes,
        dislikes: data.dislikes,
        knowledge: data.knowledge,
        worldInfo: data.worldInfo,
        systemInstructions: data.systemInstructions,
        avatarUrl: data.avatarUrl,
        categoryId: data.categoryId || null,
        visibility: data.visibility,
        contentRating: data.contentRating,
        status: data.status,
        isNsfw: data.contentRating === "mature",
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .run();

    // Tags
    if (data.tags?.length) {
      for (const tagName of data.tags) {
        const tagSlug = slugify(tagName);
        let tag = db.select().from(tags).where(eq(tags.slug, tagSlug)).get();
        if (!tag) {
          const tagId = randomUUID();
          db.insert(tags)
            .values({ id: tagId, name: tagName.toLowerCase(), slug: tagSlug, usageCount: 1 })
            .run();
          tag = { id: tagId } as typeof tag;
        }
        if (tag) {
          db.insert(characterTags)
            .values({ id: randomUUID(), characterId: id, tagId: tag.id })
            .run();
        }
      }
    }

    return NextResponse.json({ id, slug, success: true });
  } catch (e) {
    console.error("Create character error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
