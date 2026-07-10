import { z } from "zod";

export const storyInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  summary: z.string().trim().max(280).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Story content cannot be empty"),
  coverImage: z
    .string()
    .trim()
    .url("Cover image must be a valid URL")
    .optional()
    .or(z.literal("")),
  categoryIds: z.array(z.string()).max(5, "Choose up to 5 categories").default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type StoryInput = z.infer<typeof storyInputSchema>;
