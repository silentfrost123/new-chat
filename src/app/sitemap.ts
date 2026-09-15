import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { characters, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/discover`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/create`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/community-guidelines`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let characterPages: MetadataRoute.Sitemap = [];
  let profilePages: MetadataRoute.Sitemap = [];

  try {
    const chars = db
      .select({ slug: characters.slug, updatedAt: characters.updatedAt })
      .from(characters)
      .where(eq(characters.status, "published"))
      .all();

    characterPages = chars.map((c) => ({
      url: `${base}/character/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const profiles = db
      .select({ username: users.username, updatedAt: users.updatedAt })
      .from(users)
      .all()
      .filter((u) => u.username);

    profilePages = profiles.map((u) => ({
      url: `${base}/profile/${u.username}`,
      lastModified: u.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // DB may not be ready at build time
  }

  return [...staticPages, ...characterPages, ...profilePages];
}
