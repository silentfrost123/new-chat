import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "timestamp" }),
    passwordHash: text("password_hash"),
    name: text("name"),
    username: text("username").unique(),
    image: text("image"),
    bio: text("bio"),
    role: text("role", { enum: ["user", "creator", "moderator", "admin"] })
      .notNull()
      .default("user"),
    plan: text("plan", { enum: ["free", "plus", "pro"] }).notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    planExpiresAt: integer("plan_expires_at", { mode: "timestamp" }),
    isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
    banReason: text("ban_reason"),
    ageVerified: integer("age_verified", { mode: "boolean" }).notNull().default(false),
    contentPreference: text("content_preference", {
      enum: ["sfw", "mature", "all"],
    })
      .notNull()
      .default("sfw"),
    theme: text("theme", { enum: ["dark", "light", "system"] })
      .notNull()
      .default("dark"),
    memoryEnabled: integer("memory_enabled", { mode: "boolean" }).notNull().default(true),
    messageCount: integer("message_count").notNull().default(0),
    tokenCount: integer("token_count").notNull().default(0),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    usernameIdx: index("users_username_idx").on(t.username),
  })
);

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(0),
  ...timestamps,
});

export const characters = sqliteTable(
  "characters",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    personality: text("personality").notNull(),
    backstory: text("backstory"),
    scenario: text("scenario"),
    greeting: text("greeting").notNull(),
    exampleDialogue: text("example_dialogue"),
    speakingStyle: text("speaking_style"),
    goals: text("goals"),
    traits: text("traits"), // JSON array
    likes: text("likes"),
    dislikes: text("dislikes"),
    knowledge: text("knowledge"),
    worldInfo: text("world_info"),
    systemInstructions: text("system_instructions"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    categoryId: text("category_id").references(() => categories.id),
    visibility: text("visibility", { enum: ["public", "unlisted", "private"] })
      .notNull()
      .default("public"),
    contentRating: text("content_rating", {
      enum: ["safe", "suggestive", "mature"],
    })
      .notNull()
      .default("safe"),
    status: text("status", {
      enum: ["draft", "published", "unlisted", "suspended", "deleted"],
    })
      .notNull()
      .default("draft"),
    likeCount: integer("like_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    chatCount: integer("chat_count").notNull().default(0),
    messageCount: integer("message_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    trendingScore: real("trending_score").notNull().default(0),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isNsfw: integer("is_nsfw", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => ({
    slugIdx: index("characters_slug_idx").on(t.slug),
    creatorIdx: index("characters_creator_idx").on(t.creatorId),
    statusIdx: index("characters_status_idx").on(t.status),
    trendingIdx: index("characters_trending_idx").on(t.trendingScore),
    categoryIdx: index("characters_category_idx").on(t.categoryId),
  })
);

export const characterTags = sqliteTable(
  "character_tags",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniqueCharTag: uniqueIndex("character_tags_unique").on(t.characterId, t.tagId),
  })
);

export const characterVersions = sqliteTable("character_versions", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: text("snapshot").notNull(), // JSON
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    title: text("title"),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    lastMessagePreview: text("last_message_preview"),
    messageCount: integer("message_count").notNull().default(0),
    activeBranchId: text("active_branch_id"),
    ...timestamps,
  },
  (t) => ({
    userIdx: index("conversations_user_idx").on(t.userId),
    characterIdx: index("conversations_character_idx").on(t.characterId),
    lastMsgIdx: index("conversations_last_msg_idx").on(t.lastMessageAt),
  })
);

export const conversationBranches = sqliteTable("conversation_branches", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  parentMessageId: text("parent_message_id"),
  label: text("label"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => conversationBranches.id),
    parentId: text("parent_id"),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").default(0),
    model: text("model"),
    isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    generationIndex: integer("generation_index").notNull().default(0),
    siblingGroupId: text("sibling_group_id"),
    rating: integer("rating"),
    ...timestamps,
  },
  (t) => ({
    convIdx: index("messages_conversation_idx").on(t.conversationId),
    branchIdx: index("messages_branch_idx").on(t.branchId),
    siblingIdx: index("messages_sibling_idx").on(t.siblingGroupId),
  })
);

export const memories = sqliteTable(
  "memories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id").references(() => characters.id, {
      onDelete: "cascade",
    }),
    conversationId: text("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }),
    type: text("type", {
      enum: ["conversation", "character", "user", "long_term"],
    }).notNull(),
    key: text("key"),
    content: text("content").notNull(),
    importance: integer("importance").notNull().default(5),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    userIdx: index("memories_user_idx").on(t.userId),
    charIdx: index("memories_character_idx").on(t.characterId),
  })
);

export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqueLike: uniqueIndex("likes_unique").on(t.userId, t.characterId),
  })
);

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqueFav: uniqueIndex("favorites_unique").on(t.userId, t.characterId),
  })
);

export const follows = sqliteTable(
  "follows",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqueFollow: uniqueIndex("follows_unique").on(t.followerId, t.followingId),
  })
);

export const blocks = sqliteTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    uniqueBlock: uniqueIndex("blocks_unique").on(t.blockerId, t.blockedId),
  })
);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => users.id),
  reportedUserId: text("reported_user_id").references(() => users.id),
  characterId: text("character_id").references(() => characters.id),
  messageId: text("message_id").references(() => messages.id),
  conversationId: text("conversation_id").references(() => conversations.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status", {
    enum: ["pending", "reviewing", "resolved", "dismissed"],
  })
    .notNull()
    .default("pending"),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by").references(() => users.id),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  ...timestamps,
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    actorId: text("actor_id").references(() => users.id),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  })
);

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull().default(0), // cents
  priceYearly: integer("price_yearly").notNull().default(0),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  messageLimit: integer("message_limit").notNull().default(50),
  tokenLimit: integer("token_limit").notNull().default(50000),
  memoryLimit: integer("memory_limit").notNull().default(10),
  characterLimit: integer("character_limit").notNull().default(3),
  features: text("features"), // JSON
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: text("status", {
    enum: ["active", "canceled", "past_due", "trialing", "incomplete"],
  })
    .notNull()
    .default("active"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

export const usageRecords = sqliteTable(
  "usage_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").references(() => conversations.id),
    characterId: text("character_id").references(() => characters.id),
    type: text("type").notNull(), // message, token, generation
    model: text("model"),
    amount: integer("amount").notNull().default(1),
    tokensIn: integer("tokens_in").default(0),
    tokensOut: integer("tokens_out").default(0),
    durationMs: integer("duration_ms"),
    date: text("date").notNull(), // YYYY-MM-DD
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    userDateIdx: index("usage_user_date_idx").on(t.userId, t.date),
  })
);

export const aiProviders = sqliteTable("ai_providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseUrl: text("base_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(0),
  config: text("config"), // JSON
  ...timestamps,
});

export const aiModels = sqliteTable("ai_models", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => aiProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  maxTokens: integer("max_tokens").notNull().default(4096),
  contextWindow: integer("context_window").notNull().default(8192),
  costPer1kInput: real("cost_per_1k_input").default(0),
  costPer1kOutput: real("cost_per_1k_output").default(0),
  minPlan: text("min_plan", { enum: ["free", "plus", "pro"] })
    .notNull()
    .default("free"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const moderationEvents = sqliteTable("moderation_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  characterId: text("character_id").references(() => characters.id),
  messageId: text("message_id").references(() => messages.id),
  reportId: text("report_id").references(() => reports.id),
  action: text("action").notNull(),
  reason: text("reason"),
  moderatorId: text("moderator_id").references(() => users.id),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const adminActions = sqliteTable("admin_actions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type", { enum: ["info", "warning", "success", "maintenance"] })
    .notNull()
    .default("info"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id),
  ...timestamps,
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
