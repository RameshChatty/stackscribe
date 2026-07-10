import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { marked } from "marked";

import { db } from "../src/lib/db";
import {
  category,
  story,
  storyCategory,
  user,
} from "../src/lib/db/schema";
import { sanitizeContent } from "../src/lib/sanitize";
import { estimateReadingMinutes, excerpt, slugify } from "../src/lib/utils";

const categories = [
  { id: "cat-java", name: "Java", slug: "java", description: "Core Java, JVM, collections, concurrency, and modern language features." },
  { id: "cat-spring", name: "Spring & Microservices", slug: "spring-microservices", description: "Spring Boot, distributed systems, and production microservice patterns." },
  { id: "cat-system-design", name: "System Design", slug: "system-design", description: "Architecture, scalability, reliability, and design interview preparation." },
  { id: "cat-databases", name: "Databases", slug: "databases", description: "SQL, transactions, indexing, and data-intensive application concepts." },
  { id: "cat-coding", name: "Coding & DSA", slug: "coding-dsa", description: "Algorithms, data structures, coding exercises, and practical problem solving." },
  { id: "cat-career", name: "Interview Strategy", slug: "interview-strategy", description: "Question shortlists, evaluation guides, and interview preparation strategy." },
  { id: "cat-devops", name: "Production & DevOps", slug: "production-devops", description: "Troubleshooting, incident response, performance, and operational readiness." },
  { id: "cat-ai", name: "AI & Developer Tools", slug: "ai-developer-tools", description: "AI engineering, copilots, and modern developer productivity tools." },
];

const chapters = [
  ["Chapter1_CoreJava.md", "cat-java"],
  ["Chapter2_MemoryManagement.md", "cat-java"],
  ["Chapter3_Collections.md", "cat-java"],
  ["Chapter4_Java8-25Features.md", "cat-java"],
  ["Chapter5_MultiThreading.md", "cat-java"],
  ["Chapter6_Kafka.md", "cat-spring"],
  ["Chapter7_SpringBoot.md", "cat-spring"],
  ["Chapter8_CodingQuestions.md", "cat-coding"],
  ["Chapter9_SQL.md", "cat-databases"],
  ["Chapter10_AI_Copilot.md", "cat-ai"],
  ["Chapter11_AdditionalTopics.md", "cat-career"],
  ["Chapter12_InheritancePolymorphism.md", "cat-java"],
  ["Chapter13_SOLID_OOPs.md", "cat-java"],
  ["Chapter14_FileHandling.md", "cat-java"],
  ["Chapter15_DesignPatternsAndDSA.md", "cat-coding"],
  ["Chapter16_SystemDesignBasics.md", "cat-system-design"],
  ["Chapter17_JavaTrickyQuestions.md", "cat-java"],
  ["Chapter18_MicroservicesDesignPatterns.md", "cat-spring"],
  ["Chapter19_AltimetrikJavaBackend.md", "cat-career"],
  ["Chapter20_ProductionScenarios.md", "cat-devops"],
  ["Chapter21_AdvancedScenariosAndConcepts.md", "cat-system-design"],
  ["Chapter22_InterviewShortlistAndCoding.md", "cat-career"],
  ["Chapter23_JavaBackendDeveloperGuide.md", "cat-career"],
  ["Chapter24_ProductionIncidentPlaybook.md", "cat-devops"],
  ["Chapter25_JavaCodingPrograms.md", "cat-coding"],
] as const;

async function main() {
  const now = new Date();
  const authorId = "seed-stackscribe-editor";

  await db
    .insert(user)
    .values({
      id: authorId,
      name: "StackScribe Editors",
      email: "editors@stackscribe.local",
      emailVerified: true,
      username: "stackscribe",
      bio: "Curated technical interview guides for backend engineers.",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: user.id,
      set: { updatedAt: now },
    });

  for (const item of categories) {
    await db
      .insert(category)
      .values(item)
      .onConflictDoUpdate({
        target: category.id,
        set: {
          name: item.name,
          slug: item.slug,
          description: item.description,
        },
      });
  }

  for (const [filename, categoryId] of chapters) {
    const markdown = await readFile(path.join(process.cwd(), filename), "utf8");
    const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? filename;
    const rawHtml = await marked.parse(markdown);
    const content = sanitizeContent(rawHtml);
    const slug = slugify(title);
    const id = `seed-${slug}`;
    const summary = excerpt(content, 220);

    await db
      .insert(story)
      .values({
        id,
        title,
        slug,
        summary,
        content,
        status: "published",
        authorId,
        likeCount: 0,
        readingMinutes: estimateReadingMinutes(content),
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: story.id,
        set: {
          title,
          slug,
          summary,
          content,
          readingMinutes: estimateReadingMinutes(content),
          updatedAt: now,
        },
      });

    await db.delete(storyCategory).where(eq(storyCategory.storyId, id));
    await db.insert(storyCategory).values({ storyId: id, categoryId });
  }

  console.log(`Seeded ${categories.length} categories and ${chapters.length} stories.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
