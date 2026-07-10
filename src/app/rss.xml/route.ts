import { getPublishedStories } from "@/lib/data/stories";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const stories = await getPublishedStories({ limit: 100 });
  const items = stories
    .map(
      (story) => `<item>
<title>${escapeXml(story.title)}</title>
<link>${env.APP_URL}/story/${story.slug}</link>
<guid>${env.APP_URL}/story/${story.slug}</guid>
<description>${escapeXml(story.summary ?? "")}</description>
<author>${escapeXml(story.author.name)}</author>
<pubDate>${(story.publishedAt ?? story.createdAt).toUTCString()}</pubDate>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>StackScribe</title>
<link>${env.APP_URL}</link>
<description>Technical stories and interview preparation guides.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
