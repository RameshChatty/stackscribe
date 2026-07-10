import type { MetadataRoute } from "next";

import { getCategories } from "@/lib/data/categories";
import { getPublishedStories } from "@/lib/data/stories";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, categories] = await Promise.all([
    getPublishedStories({ limit: 1000 }),
    getCategories(),
  ]);
  return [
    { url: env.APP_URL, changeFrequency: "daily", priority: 1 },
    {
      url: `${env.APP_URL}/categories`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...stories.map((story) => ({
      url: `${env.APP_URL}/story/${story.slug}`,
      lastModified: story.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categories.map((category) => ({
      url: `${env.APP_URL}/category/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
