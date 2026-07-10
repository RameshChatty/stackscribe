import type {
  AuthorSummary,
  CategorySummary,
  StoryDetail,
  StorySummary,
} from "@/lib/data/types";

const editor: AuthorSummary = {
  id: "demo-editor",
  name: "StackScribe Editors",
  username: "stackscribe",
  image: null,
  bio: "Curated technical interview guides for backend engineers.",
};

const maya: AuthorSummary = {
  id: "demo-maya",
  name: "Maya Rao",
  username: "mayacodes",
  image: null,
  bio: "Staff engineer writing about distributed systems and career growth.",
};

const arjun: AuthorSummary = {
  id: "demo-arjun",
  name: "Arjun Mehta",
  username: "arjunbackend",
  image: null,
  bio: "Java and Spring Boot engineer focused on production reliability.",
};

export const demoCategories: CategorySummary[] = [
  {
    id: "cat-java",
    name: "Java",
    slug: "java",
    description: "Core Java, JVM, collections, concurrency, and language features.",
    storyCount: 3,
  },
  {
    id: "cat-spring",
    name: "Spring & Microservices",
    slug: "spring-microservices",
    description: "Spring Boot, distributed systems, and microservice patterns.",
    storyCount: 2,
  },
  {
    id: "cat-system-design",
    name: "System Design",
    slug: "system-design",
    description: "Architecture, scalability, reliability, and design interviews.",
    storyCount: 2,
  },
  {
    id: "cat-databases",
    name: "Databases",
    slug: "databases",
    description: "SQL, transactions, indexing, and data-intensive applications.",
    storyCount: 1,
  },
  {
    id: "cat-coding",
    name: "Coding & DSA",
    slug: "coding-dsa",
    description: "Algorithms, data structures, and practical coding exercises.",
    storyCount: 1,
  },
  {
    id: "cat-career",
    name: "Interview Strategy",
    slug: "interview-strategy",
    description: "Question shortlists, evaluation guides, and preparation plans.",
    storyCount: 1,
  },
];

const category = (slug: string) =>
  demoCategories.find((item) => item.slug === slug)!;

const now = new Date("2026-07-09T12:00:00.000Z");
const day = 86_400_000;

export const demoStories: StoryDetail[] = [
  {
    id: "demo-java-equals",
    title: "The Java equals() and hashCode() Contract, Explained Clearly",
    slug: "java-equals-hashcode-contract",
    summary:
      "A practical mental model for reference equality, value equality, hash-based collections, and the bugs interviewers expect you to recognize.",
    coverImage: null,
    status: "published",
    readingMinutes: 7,
    likeCount: 128,
    publishedAt: new Date(now.getTime() - day),
    createdAt: new Date(now.getTime() - day),
    updatedAt: new Date(now.getTime() - day),
    author: editor,
    categories: [category("java"), category("interview-strategy")],
    likedByViewer: false,
    content: `<p>Java gives us two very different ways to compare objects: reference comparison with <code>==</code> and logical equality with <code>equals()</code>. Senior engineers need to understand not only the syntax, but the contract that keeps collections correct.</p><h2>Reference identity versus value equality</h2><p>The <code>==</code> operator asks whether two variables point at the exact same object. A well-designed <code>equals()</code> implementation asks whether two distinct objects represent the same value.</p><pre><code>String first = new String("Java");
String second = new String("Java");

first == second;       // false
first.equals(second);  // true</code></pre><h2>Why hashCode() must agree</h2><p>HashMap and HashSet first choose a bucket using <code>hashCode()</code>, then use <code>equals()</code> inside that bucket. Equal objects must therefore produce the same hash code. If they do not, lookups become unreliable even when <code>equals()</code> returns true.</p><blockquote>The rule is one-directional: equal objects must have equal hash codes, but two unequal objects may share a hash code.</blockquote><h2>Interview checklist</h2><ul><li>Check identity first for a fast path.</li><li>Handle null and incompatible classes.</li><li>Compare every field that contributes to logical identity.</li><li>Use the same fields in <code>hashCode()</code>.</li><li>Avoid mutable keys in hash-based collections.</li></ul>`,
  },
  {
    id: "demo-system-design",
    title: "Designing a URL Shortener: From Requirements to Trade-offs",
    slug: "designing-a-url-shortener",
    summary:
      "Turn a common system-design prompt into a structured conversation about identifiers, storage, caching, and reliability.",
    coverImage: null,
    status: "published",
    readingMinutes: 9,
    likeCount: 94,
    publishedAt: new Date(now.getTime() - day * 2),
    createdAt: new Date(now.getTime() - day * 2),
    updatedAt: new Date(now.getTime() - day * 2),
    author: maya,
    categories: [category("system-design")],
    likedByViewer: false,
    content: `<p>A strong system-design answer begins with questions, not components. Clarify traffic, link lifetime, custom aliases, analytics, and availability before drawing boxes.</p><h2>Core API</h2><pre><code>POST /links  { "url": "https://example.com/long" }
GET  /:code  → 302 redirect</code></pre><h2>Identifier strategy</h2><p>Base62 encoding produces compact, URL-safe identifiers. You can encode a database sequence, generate random tokens with collision checks, or allocate ranges to independent ID services. Each choice trades simplicity against predictability and coordination.</p><h2>Read path</h2><ol><li>Look up the short code in a distributed cache.</li><li>Fall back to the primary data store on a miss.</li><li>Populate the cache with an expiry.</li><li>Return an HTTP redirect and emit analytics asynchronously.</li></ol><p>Separating redirect latency from analytics processing keeps the critical path fast and resilient.</p>`,
  },
  {
    id: "demo-spring-production",
    title: "Seven Spring Boot Production Failures Worth Rehearsing",
    slug: "spring-boot-production-failures",
    summary:
      "Connection pools, cascading retries, thread starvation, memory pressure, and the signals that help you distinguish them quickly.",
    coverImage: null,
    status: "published",
    readingMinutes: 8,
    likeCount: 76,
    publishedAt: new Date(now.getTime() - day * 3),
    createdAt: new Date(now.getTime() - day * 3),
    updatedAt: new Date(now.getTime() - day * 3),
    author: arjun,
    categories: [category("spring-microservices"), category("system-design")],
    likedByViewer: false,
    content: `<p>Production troubleshooting is less about memorizing fixes and more about narrowing the search space with evidence. Start with impact, timing, and recent changes.</p><h2>Connection-pool exhaustion</h2><p>Symptoms include rising request latency, threads waiting on database connections, and a database that may still look healthy. Check active versus idle pool metrics, slow queries, transaction duration, and leaked connections.</p><h2>Cascading retries</h2><p>Retries amplify load when a dependency is already struggling. Use bounded exponential backoff with jitter, strict timeouts, and retry budgets. Never retry every error blindly.</p><h2>Thread starvation</h2><p>Thread dumps reveal whether request threads are blocked on network calls, locks, or pool acquisition. Correlate the dump with endpoint latency and downstream health before changing executor sizes.</p>`,
  },
  {
    id: "demo-sql",
    title: "SQL Interview Questions That Reveal Real Database Understanding",
    slug: "sql-interview-questions-real-understanding",
    summary:
      "Go beyond joins: isolation levels, index selectivity, execution plans, pagination, and production-safe query optimization.",
    coverImage: null,
    status: "published",
    readingMinutes: 6,
    likeCount: 61,
    publishedAt: new Date(now.getTime() - day * 4),
    createdAt: new Date(now.getTime() - day * 4),
    updatedAt: new Date(now.getTime() - day * 4),
    author: editor,
    categories: [category("databases"), category("interview-strategy")],
    likedByViewer: false,
    content: `<p>Good database interviews test reasoning about data shape and workload, not only SQL syntax. Ask candidates to explain what the database must do.</p><h2>When does an index help?</h2><p>An index is most useful when it eliminates a meaningful amount of work. Selectivity, table size, predicate shape, ordering, and the columns needed by the query all matter.</p><h2>Offset versus keyset pagination</h2><p>Large offsets force the database to walk past rows it will discard. Keyset pagination starts after the last observed sort key and remains stable as the dataset grows.</p><pre><code>SELECT id, title, created_at
FROM story
WHERE (created_at, id) &lt; ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;</code></pre>`,
  },
  {
    id: "demo-concurrency",
    title: "CompletableFuture Without the Common Thread-Pool Mistakes",
    slug: "completablefuture-thread-pool-mistakes",
    summary:
      "Understand composition, exception handling, executor selection, and why blocking the common pool can damage an entire service.",
    coverImage: null,
    status: "published",
    readingMinutes: 7,
    likeCount: 52,
    publishedAt: new Date(now.getTime() - day * 5),
    createdAt: new Date(now.getTime() - day * 5),
    updatedAt: new Date(now.getTime() - day * 5),
    author: arjun,
    categories: [category("java")],
    likedByViewer: false,
    content: `<p><code>CompletableFuture</code> is a composition tool, not a promise that all work should run asynchronously. The executor you choose determines isolation and capacity.</p><h2>Compose, do not block</h2><p>Use <code>thenCompose</code> when one asynchronous operation depends on another. Calling <code>join()</code> inside a pipeline turns asynchronous code back into blocking code and can create starvation.</p><h2>Pick an executor intentionally</h2><p>CPU-bound work and blocking I/O have different sizing needs. A dedicated, bounded executor prevents one feature from consuming the global common pool.</p><h2>Handle failures once</h2><p>Use <code>handle</code>, <code>exceptionally</code>, or <code>whenComplete</code> based on whether you are recovering, transforming, or observing. Preserve the original cause for diagnostics.</p>`,
  },
  {
    id: "demo-interview-plan",
    title: "A Four-Week Senior Backend Interview Preparation Plan",
    slug: "four-week-backend-interview-plan",
    summary:
      "A realistic schedule that balances Java depth, Spring, SQL, system design, coding practice, and mock interviews.",
    coverImage: null,
    status: "published",
    readingMinutes: 5,
    likeCount: 47,
    publishedAt: new Date(now.getTime() - day * 6),
    createdAt: new Date(now.getTime() - day * 6),
    updatedAt: new Date(now.getTime() - day * 6),
    author: maya,
    categories: [category("interview-strategy"), category("coding-dsa")],
    likedByViewer: false,
    content: `<p>Preparation works best as a feedback loop: learn, explain, solve, and review. Four focused weeks are enough to expose gaps and build confidence without trying to memorize everything.</p><h2>Week 1: language and runtime</h2><p>Review Java fundamentals, collections, concurrency, JVM memory, and modern language features. Explain each concept aloud and connect it to a production example.</p><h2>Week 2: frameworks and data</h2><p>Cover Spring Boot internals, transactions, security basics, SQL plans, indexes, and messaging. Practice debugging scenarios instead of reading only happy-path tutorials.</p><h2>Week 3: design and coding</h2><p>Solve one coding problem daily and complete three system-design prompts. Record assumptions, bottlenecks, and trade-offs.</p><h2>Week 4: simulation</h2><p>Run timed mock interviews, revisit weak areas, and prepare concise stories about incidents, technical decisions, mentorship, and delivery.</p>`,
  },
];

export function getDemoStories(options: {
  limit?: number;
  categorySlug?: string;
  authorId?: string;
} = {}): StorySummary[] {
  const { limit = 30, categorySlug, authorId } = options;
  return demoStories
    .filter(
      (story) =>
        (!categorySlug || story.categories.some((c) => c.slug === categorySlug)) &&
        (!authorId || story.author.id === authorId),
    )
    .slice(0, limit);
}

export function getDemoStory(slug: string): StoryDetail | null {
  return demoStories.find((story) => story.slug === slug) ?? null;
}

export function getDemoAuthor(username: string): AuthorSummary | null {
  return [editor, maya, arjun].find((author) => author.username === username) ?? null;
}
