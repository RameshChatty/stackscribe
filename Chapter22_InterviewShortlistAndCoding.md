# Chapter 22: Interview Shortlist — Core Java, Spring, SQL, System Design & Coding

## Overview

A focused shortlist of commonly-asked questions across Core Java & Concurrency, Spring Boot & Microservices, SQL, and System Design, followed by hands-on coding problems (Rate Limiter, LRU Cache, API Logger, concurrent seat booking) and a graph-based flights problem. Each item has a detailed answer with code where applicable.

---

# Section A — Core Java & Concurrency

## A1: How does HashMap work internally?

### Answer:

`HashMap` stores key-value pairs in an array of **buckets**. On `put`:

1. `hashCode()` of the key is computed, then spread: `(h = key.hashCode()) ^ (h >>> 16)`.
2. Bucket index = `(n - 1) & hash` (`n` = capacity, a power of two).
3. If the bucket is empty, insert; otherwise resolve the collision.

**Collisions** are chained as a **linked list**, and in Java 8+ a bucket converts to a **red-black tree** when it holds more than 8 entries (and table size ≥ 64), improving worst case from `O(n)` to `O(log n)`.

`get` recomputes the bucket and uses `equals()` to find the entry within it. When `size > capacity * loadFactor` (default 0.75), the map **resizes** (doubles) and rehashes.

### Key point:

Array of buckets indexed by a spread hash; collisions chain as a list that treeifies past a threshold; both `hashCode()` and `equals()` locate an entry; it resizes at the load factor.

---

## A2: HashMap vs ConcurrentHashMap

### Answer:

| | HashMap | ConcurrentHashMap |
|---|---|---|
| Thread-safe | No | Yes |
| Locking | None | CAS + bin-level `synchronized` (no global lock) |
| Null key/values | 1 null key, null values allowed | Not allowed |
| Iterator | Fail-fast | Weakly consistent |
| Use | Single-threaded | Concurrent access |

`ConcurrentHashMap` allows concurrent reads and high-concurrency writes by locking only individual bins, so it scales far better than a globally-synchronized map. `HashMap` under concurrent writes can corrupt state or throw `ConcurrentModificationException`.

### Key point:

Use `HashMap` single-threaded; use `ConcurrentHashMap` for concurrent access — it's thread-safe with fine-grained locking and disallows nulls.

---

## A3: Volatile vs Synchronized

### Answer:

- **`volatile`:** guarantees **visibility** of a single variable across threads and prevents instruction reordering, but provides **no atomicity** for compound operations (`count++`). Lightweight; no locking.
- **`synchronized`:** provides **mutual exclusion + visibility** for a block/method — only one thread in the critical section at a time. Handles compound operations atomically, but has locking overhead and can cause contention.

Use `volatile` for simple flags/state published between threads; use `synchronized` when you must make a compound read-modify-write atomic.

### Key point:

`volatile` = visibility only (no mutual exclusion); `synchronized` = mutual exclusion + visibility for compound operations.

---

## A4: How do you make a method thread-safe?

### Answer:

Options depending on the situation:

- **Synchronization:** `synchronized` method/block, or `ReentrantLock`/`ReadWriteLock`.
- **Atomic classes:** `AtomicInteger`, `AtomicReference`, `LongAdder` for lock-free counters.
- **Immutability:** immutable objects are inherently thread-safe.
- **Thread-safe collections:** `ConcurrentHashMap`, `CopyOnWriteArrayList`.
- **Thread confinement:** `ThreadLocal`, or avoid shared mutable state (stateless methods are automatically thread-safe).
- **Minimize the critical section** to reduce contention.

```java
private final AtomicInteger counter = new AtomicInteger();
public void increment() { counter.incrementAndGet(); } // lock-free, thread-safe
```

### Key point:

Eliminate shared mutable state (statelessness/immutability) where possible; otherwise guard it with synchronization, atomics, or concurrent collections — keeping critical sections minimal.

---

## A5: ExecutorService use cases

### Answer:

`ExecutorService` manages a **pool of reusable threads**, decoupling task submission from execution. Use cases:

- **Parallelizing independent tasks** (fan-out/fan-in with `invokeAll`, `CompletableFuture`).
- **Bounded concurrency / backpressure** — fixed pool + queue prevents unbounded thread creation.
- **Asynchronous background work** (emails, notifications, I/O).
- **Scheduled/periodic tasks** via `ScheduledExecutorService`.
- **Handling many short-lived tasks** efficiently (thread reuse avoids creation cost).

```java
ExecutorService pool = Executors.newFixedThreadPool(8);
List<Future<Result>> futures = pool.invokeAll(tasks);
pool.shutdown();
```

Prefer a configured `ThreadPoolExecutor` (explicit core/max/queue/rejection policy) over `Executors` factory methods in production.

### Key point:

Reuse and bound threads for parallel, asynchronous, scheduled, or high-volume short tasks — avoiding the cost/risk of manual thread creation.

---

# Section B — Spring Boot & Microservices

## B1: How Dependency Injection works internally?

### Answer:

Spring's **IoC container** manages object creation and wiring:

1. On startup, it scans for beans (`@Component`/`@Bean` + `@ComponentScan`) and builds **BeanDefinitions** (metadata: class, scope, dependencies).
2. It instantiates beans and resolves their dependencies by **type** (then `@Qualifier`/name), building the dependency graph in the right order.
3. Injection happens via **constructor**, setter, or field (reflection).
4. `BeanPostProcessor`s run (e.g. `AutowiredAnnotationBeanPostProcessor` processes `@Autowired`; AOP proxies are created).
5. Beans are cached (singletons) in the container and handed out on request.

### Key point:

The container reads bean definitions, instantiates beans, resolves dependencies by type, and injects them (via constructor/setter/field using reflection and BeanPostProcessors) — inverting control of object creation.

---

## B2: What happens behind @Transactional?

### Answer:

Spring creates an **AOP proxy** around the bean. A `TransactionInterceptor` wraps the method:

1. **Begin/join** a transaction via the `PlatformTransactionManager` (opens a connection, disables autocommit) per the **propagation** setting.
2. Bind the connection/`EntityManager` to the thread.
3. Invoke the method.
4. **Commit** on normal return; **rollback** on a runtime exception (checked exceptions don't roll back unless `rollbackFor` is set).

Because it's proxy-based, it only applies to **external calls to public methods** — private methods and same-class self-invocation bypass it.

### Key point:

A proxy interceptor begins a transaction, commits on success, rolls back on unchecked exceptions, honoring propagation/isolation — and only works on external calls to public methods.

---

## B3: How do microservices achieve fault tolerance?

### Answer:

- **Circuit Breaker** (Resilience4j): fail fast when a dependency is unhealthy; return a fallback.
- **Timeouts:** never block indefinitely.
- **Retries with exponential backoff + jitter:** for transient, idempotent failures.
- **Bulkhead:** isolate resources per dependency so one failure can't exhaust all threads.
- **Fallback / graceful degradation:** cached or default responses.
- **Redundancy & load balancing:** multiple instances behind a load balancer; health checks + auto-restart.
- **Asynchronous messaging** to decouple services (a down consumer doesn't fail the producer).
- **Rate limiting / load shedding** to protect under overload.

### Key point:

Combine circuit breakers, timeouts, bounded retries, bulkheads, fallbacks, redundancy/health checks, and async messaging so a single failure is contained and the system degrades gracefully.

---

## B4: How do you handle distributed transactions?

### Answer:

Avoid two-phase commit (2PC) in microservices (poor availability/scalability). Prefer **eventual consistency**:

- **Saga pattern:** a sequence of local transactions, each with a **compensating action** to undo prior steps on failure. Coordinated via **choreography** (events) or **orchestration** (central coordinator).
- **Outbox pattern:** atomically persist the business change + an event in the same DB, then reliably publish the event (avoids dual-write inconsistency).
- **Idempotency + retries** for transient failures; **dead-letter queues** for poison messages.

```text
Order Saga: createOrder → chargePayment → reserveInventory → confirm
On inventory failure → compensate: refundPayment → cancelOrder
```

### Key point:

Use Sagas with compensating transactions (plus the outbox pattern and idempotency) for eventual consistency instead of distributed 2PC.

---

# Section C — SQL

## C1: Find the 2nd / 3rd highest salary

### Answer:

Given `employee(id, name, salary)`:

**Generic Nth-highest using DENSE_RANK (handles ties, standard SQL):**

```sql
SELECT salary
FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employee
) t
WHERE rnk = 2;   -- change to 3 for third highest
```

**2nd highest with a subquery:**

```sql
SELECT MAX(salary) FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);
```

**Using LIMIT/OFFSET (MySQL/Postgres):**

```sql
SELECT DISTINCT salary FROM employee
ORDER BY salary DESC
LIMIT 1 OFFSET 1;   -- OFFSET 2 for third highest
```

### Key point:

`DENSE_RANK()` is the robust, tie-safe way to get the Nth highest (just change the rank); `DISTINCT` + `LIMIT/OFFSET` or nested `MAX` also work for the 2nd.

---

## C2: ACID Properties

### Answer:

- **Atomicity:** a transaction is all-or-nothing; partial changes are rolled back on failure.
- **Consistency:** a transaction moves the DB from one valid state to another, preserving constraints/invariants.
- **Isolation:** concurrent transactions don't interfere; results are as if run serially (tuned by isolation levels: READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE, trading concurrency vs anomalies like dirty/non-repeatable/phantom reads).
- **Durability:** once committed, changes survive crashes (persisted to disk/write-ahead log).

### Key point:

Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (no interference between concurrent transactions), Durability (committed data survives failures).

---

## C3: Clustered vs Non-Clustered Index

### Answer:

- **Clustered index:** defines the **physical order** of rows; the table data *is* the index leaf. Only **one** per table (usually the primary key). Fast range scans.
- **Non-clustered index:** a **separate** structure holding indexed column(s) + a pointer to the row. **Many** allowed per table. Needs an extra lookup to fetch non-indexed columns (unless it's a covering index).

```sql
CREATE TABLE employee (
  id INT PRIMARY KEY,          -- clustered (physical order)
  dept_id INT
);
CREATE INDEX idx_dept ON employee(dept_id);  -- non-clustered
```

### Key point:

Clustered = table physically sorted by the key (one per table); non-clustered = separate lookup structure pointing to rows (many per table).

---

## C4: Query Optimization Techniques

### Answer:

- **Indexing:** add indexes on `WHERE`/`JOIN`/`ORDER BY` columns; use composite/covering indexes; avoid over-indexing (slows writes).
- **Analyze the plan:** `EXPLAIN ANALYZE` to spot seq scans, expensive sorts, bad estimates.
- **Write better SQL:** avoid `SELECT *`, unnecessary joins/subqueries, functions on indexed columns, leading wildcards; use `EXISTS` vs `IN` appropriately.
- **Pagination** instead of loading everything; limit result sets.
- **Update statistics**; fix data types to avoid implicit conversions.
- **Denormalization / materialized views / caching** for heavy read paths.
- **Partitioning** large tables; **connection pooling**; fix ORM N+1.

### Key point:

Index the right columns, read the execution plan, rewrite queries to be sargable, paginate, keep statistics fresh, and cache/denormalize hot read paths.

---

# Section D — System Design & Coding

## D1: Design and Implement a Rate Limiter

### Answer:

**Design:** limit requests per client per time window. Key by API key/user/IP. Common algorithms:

- **Fixed window:** count per window; simple but bursty at edges.
- **Sliding window:** smoother, more accurate.
- **Token bucket:** tokens refill at a fixed rate, each request consumes one; allows bursts up to bucket capacity — the most popular.
- **Leaky bucket:** processes at a constant rate.

For **distributed** systems, keep counters in **Redis** (atomic via Lua/`INCR`+`EXPIRE`) so all instances share state; enforce at the **API gateway**. Return `429 Too Many Requests` + `Retry-After`.

**In-memory token bucket implementation:**

```java
public class TokenBucketRateLimiter {
    private final long capacity;
    private final double refillPerMillis;
    private double tokens;
    private long lastRefill;

    public TokenBucketRateLimiter(long capacity, double tokensPerSecond) {
        this.capacity = capacity;
        this.refillPerMillis = tokensPerSecond / 1000.0;
        this.tokens = capacity;
        this.lastRefill = System.currentTimeMillis();
    }

    public synchronized boolean allowRequest() {
        refill();
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.currentTimeMillis();
        tokens = Math.min(capacity, tokens + (now - lastRefill) * refillPerMillis);
        lastRefill = now;
    }
}
```

### Key point:

Token bucket keyed per client is the go-to algorithm; back it with Redis for distributed limits, enforce at the gateway, and respond with `429` + `Retry-After`.

---

## D2: Implement an LRU Cache

### Answer:

An **LRU (Least Recently Used)** cache evicts the least-recently-accessed entry when full. Requires `O(1)` get/put: a **HashMap** (key → node) + a **doubly linked list** (ordering by recency). Most-recent at the head, least-recent at the tail (evict the tail).

**Simplest (interview-friendly) — extend `LinkedHashMap`:**

```java
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}
```

**From scratch — HashMap + doubly linked list:**

```java
class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node n = map.get(key);
        remove(n); insertFront(n);   // mark as most-recently used
        return n.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) remove(map.get(key));
        Node n = new Node(key, value);
        map.put(key, n); insertFront(n);
        if (map.size() > capacity) {
            Node lru = tail.prev;    // least-recently used
            remove(lru); map.remove(lru.key);
        }
    }

    private void remove(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void insertFront(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }

    static class Node { int key, value; Node prev, next; Node(int k, int v){key=k;value=v;} }
}
```

For thread safety/production use Caffeine or a `ConcurrentHashMap`-based design.

### Key point:

HashMap (O(1) lookup) + doubly linked list (O(1) recency reorder/eviction); `LinkedHashMap` with `accessOrder=true` + `removeEldestEntry` is the concise version.

---

## D3: How would you design a Logger to track API calls?

### Answer:

**Goals:** capture each API call (method, path, status, latency, user, correlation id) without cluttering business code, and do it with minimal performance impact.

**Design:**

- **Cross-cutting capture:** a Servlet **Filter** / Spring **`OncePerRequestFilter`** or an **interceptor**/AOP aspect wraps every request — no per-controller code.
- **Correlation id:** generate/propagate a trace id, store in **MDC** so every log line is correlatable.
- **Structured (JSON) logs** shipped asynchronously to a central store (ELK/Loki/Splunk); use **async appenders** to avoid blocking request threads.
- **What to log:** timestamp, method, URI, status, duration, client/user, trace id — but **never log secrets/PII** (mask them).
- **Sampling / log levels** for high-traffic endpoints; retention policy.

```java
@Component
class ApiLoggingFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        String traceId = Optional.ofNullable(req.getHeader("X-Trace-Id"))
                                 .orElse(UUID.randomUUID().toString());
        MDC.put("traceId", traceId);
        try {
            chain.doFilter(req, res);
        } finally {
            long ms = System.currentTimeMillis() - start;
            log.info("method={} uri={} status={} durationMs={}",
                     req.getMethod(), req.getRequestURI(), res.getStatus(), ms);
            MDC.clear();
        }
    }
}
```

### Key point:

Use a request filter/interceptor to log every call centrally with a correlation id in MDC, emit structured logs asynchronously to a central store, and mask sensitive data.

---

## D4: How would you handle concurrent seat booking for a single seat?

### Answer:

The challenge: two users must not book the **same seat**. Prevent the race with locking on the seat resource:

- **Pessimistic locking:** `SELECT ... FOR UPDATE` on the seat row so the second transaction waits until the first commits, then sees it as booked.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select s from Seat s where s.id = :id")
Seat findForUpdate(@Param("id") Long id);
// then: if (seat.isBooked()) throw ...; seat.book(user);  // within one transaction
```

- **Optimistic locking:** a `@Version` column; the loser gets `OptimisticLockException` and is told the seat was just taken. Good when contention is usually low.
- **Unique constraint:** a `booking(seat_id UNIQUE, ...)` row so the DB rejects the second insert atomically.
- **Distributed lock (Redis/Zookeeper)** or a **temporary hold/reservation** (lock the seat for N minutes during checkout) for high-scale systems.

### Key point:

Serialize access to the seat: pessimistic `SELECT ... FOR UPDATE` (or `@Version` optimistic locking, or a unique constraint on the booking) so only one booking for a given seat can succeed.

---

# Section E — Graph-Based Problem: Flights

Given routes:

```
DEL → MUM
DEL → HYD
MUM → GOA
HYD → GOA
```

Model as a **directed graph** (adjacency list). Implement: direct flight, connecting flights, shortest route, and all possible routes.

### Answer:

```java
import java.util.*;

public class FlightGraph {
    private final Map<String, List<String>> adj = new HashMap<>();

    public void addRoute(String from, String to) {
        adj.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
        adj.putIfAbsent(to, new ArrayList<>());
    }

    // 1. Direct flight: is there an edge from -> to?
    public boolean hasDirectFlight(String from, String to) {
        return adj.getOrDefault(from, List.of()).contains(to);
    }

    // 2. Connecting flights: reachable via >= 1 intermediate stop (not direct)
    public boolean hasConnectingFlight(String from, String to) {
        if (hasDirectFlight(from, to)) return false;
        return canReach(from, to);
    }

    private boolean canReach(String from, String to) {
        Set<String> visited = new HashSet<>();
        Deque<String> stack = new ArrayDeque<>(List.of(from));
        while (!stack.isEmpty()) {
            String node = stack.pop();
            if (node.equals(to)) return true;
            if (!visited.add(node)) continue;
            stack.addAll(adj.getOrDefault(node, List.of()));
        }
        return false;
    }

    // 3. Shortest route (fewest hops) via BFS
    public List<String> shortestRoute(String from, String to) {
        Queue<List<String>> queue = new LinkedList<>();
        queue.add(new ArrayList<>(List.of(from)));
        Set<String> visited = new HashSet<>(List.of(from));
        while (!queue.isEmpty()) {
            List<String> path = queue.poll();
            String last = path.get(path.size() - 1);
            if (last.equals(to)) return path;
            for (String next : adj.getOrDefault(last, List.of())) {
                if (visited.add(next)) {
                    List<String> newPath = new ArrayList<>(path);
                    newPath.add(next);
                    queue.add(newPath);
                }
            }
        }
        return Collections.emptyList(); // no route
    }

    // 4. All possible routes via DFS backtracking
    public List<List<String>> allRoutes(String from, String to) {
        List<List<String>> result = new ArrayList<>();
        dfs(from, to, new ArrayList<>(List.of(from)), new HashSet<>(List.of(from)), result);
        return result;
    }

    private void dfs(String cur, String to, List<String> path,
                     Set<String> visited, List<List<String>> result) {
        if (cur.equals(to)) { result.add(new ArrayList<>(path)); return; }
        for (String next : adj.getOrDefault(cur, List.of())) {
            if (visited.add(next)) {
                path.add(next);
                dfs(next, to, path, visited, result);
                path.remove(path.size() - 1);   // backtrack
                visited.remove(next);
            }
        }
    }

    public static void main(String[] args) {
        FlightGraph g = new FlightGraph();
        g.addRoute("DEL", "MUM");
        g.addRoute("DEL", "HYD");
        g.addRoute("MUM", "GOA");
        g.addRoute("HYD", "GOA");

        System.out.println(g.hasDirectFlight("DEL", "MUM"));      // true
        System.out.println(g.hasConnectingFlight("DEL", "GOA"));  // true
        System.out.println(g.shortestRoute("DEL", "GOA"));        // [DEL, MUM, GOA]
        System.out.println(g.allRoutes("DEL", "GOA"));            // [[DEL,MUM,GOA],[DEL,HYD,GOA]]
    }
}
```

### Explanation:

- **Direct flight:** a single edge check — `O(1)` (or `O(degree)`).
- **Connecting flight:** reachable through intermediates but not direct — DFS/BFS reachability.
- **Shortest route:** **BFS** gives the fewest-hops path in an unweighted graph. (Use **Dijkstra** if edges have weights like duration/cost.)
- **All possible routes:** **DFS with backtracking**, tracking visited nodes to avoid cycles.

### Key point:

Model flights as a directed graph (adjacency list): edge check for direct, DFS/BFS reachability for connecting, **BFS** for fewest-hops shortest route (Dijkstra if weighted), and **DFS + backtracking** for all routes.

---

## Evaluation Tips

- For concurrency, look for the right tool per situation (immutability/atomics/locks/concurrent collections) and awareness of `volatile`'s no-atomicity limit.
- For Spring, check understanding of **proxy-based** DI/transactions and eventual-consistency patterns (Saga/outbox) for distributed transactions.
- For SQL, confirm they can write the Nth-highest query safely (ties) and explain ACID and index types precisely.
- For coding, evaluate the LRU cache (O(1) design), a correct rate-limiter algorithm, safe seat-booking (locking/unique constraint), and clean BFS/DFS on the flights graph — including choosing BFS vs Dijkstra by whether edges are weighted.
