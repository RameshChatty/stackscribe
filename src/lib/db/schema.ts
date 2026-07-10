import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Better Auth core tables. Column and table names follow the Better Auth
 * default schema so the Drizzle adapter can map onto them directly.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  username: text("username").unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

/**
 * Application domain tables.
 */
export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("category_slug_idx").on(table.slug)],
);

export const story = pgTable(
  "story",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    summary: text("summary"),
    content: text("content").notNull().default(""),
    coverImage: text("cover_image"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    likeCount: integer("like_count").notNull().default(0),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("story_author_idx").on(table.authorId),
    index("story_status_idx").on(table.status),
    index("story_published_idx").on(table.publishedAt),
  ],
);

export const storyCategory = pgTable(
  "story_category",
  {
    storyId: text("story_id")
      .notNull()
      .references(() => story.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.storyId, table.categoryId] }),
    index("story_category_category_idx").on(table.categoryId),
  ],
);

export const like = pgTable(
  "like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storyId: text("story_id")
      .notNull()
      .references(() => story.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.storyId] }),
    uniqueIndex("like_user_story_idx").on(table.userId, table.storyId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  stories: many(story),
  likes: many(like),
}));

export const storyRelations = relations(story, ({ one, many }) => ({
  author: one(user, {
    fields: [story.authorId],
    references: [user.id],
  }),
  storyCategories: many(storyCategory),
  likes: many(like),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  storyCategories: many(storyCategory),
}));

export const storyCategoryRelations = relations(storyCategory, ({ one }) => ({
  story: one(story, {
    fields: [storyCategory.storyId],
    references: [story.id],
  }),
  category: one(category, {
    fields: [storyCategory.categoryId],
    references: [category.id],
  }),
}));

export const likeRelations = relations(like, ({ one }) => ({
  user: one(user, {
    fields: [like.userId],
    references: [user.id],
  }),
  story: one(story, {
    fields: [like.storyId],
    references: [story.id],
  }),
}));

export type User = typeof user.$inferSelect;
export type Story = typeof story.$inferSelect;
export type Category = typeof category.$inferSelect;
export type Like = typeof like.$inferSelect;
