export type StoryStatus = "draft" | "published";

export interface AuthorSummary {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bio?: string | null;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  storyCount?: number;
}

export interface StorySummary {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  status: StoryStatus;
  readingMinutes: number;
  likeCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: AuthorSummary;
  categories: CategorySummary[];
}

export interface StoryDetail extends StorySummary {
  content: string;
  likedByViewer: boolean;
}
