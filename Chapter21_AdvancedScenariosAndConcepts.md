# Chapter 21: Advanced Backend Scenarios & Concept Deep-Dives

## Overview

This chapter is a large, mixed set of questions frequently asked in experienced Java backend interviews. It is organized into four sections:

- **Section A — Production Debugging Scenarios** (10)
- **Section B — Core Java, JVM, Spring, Database & System Design Scenarios** (20)
- **Section C — Concept & Design Deep-Dives** (22)
- **Section D — Java 8 Coding Questions** (2)

Each question has a detailed answer with concrete steps, patterns, and code examples where useful.

---

# Section A — Production Debugging Scenarios

## A1: An API suddenly becomes slow after a release, but CPU and memory look normal. Where do you start?

### Answer:

Normal CPU/memory means threads are likely **waiting** (I/O-bound), not computing.

1. **Diff the release:** what changed — new query, extra remote call, changed config, new library, a synchronous call added to a hot path?
2. **Distributed tracing:** find which span grew (DB, downstream service, external API).
3. **Thread dump:** look for threads `BLOCKED`/`WAITING` on DB connections, locks, or HTTP clients — a sign of pool exhaustion or lock contention.
4. **DB side:** slow query log, missing index, N+1 introduced by an ORM change.
5. **Connection pools / timeouts:** a small pool or a slow downstream causes queuing while CPU stays idle.

### Key point:

Idle CPU + high latency ⇒ waiting on I/O/locks. Use tracing + thread dumps to find the blocking call, and compare against exactly what the release changed.

---

## A2: A Spring Boot service returns 500 errors randomly without clear logs. What will you check?

### Answer:

- **Exception handling gaps:** ensure a `@ControllerAdvice`/`@ExceptionHandler` logs the full stack trace; unhandled exceptions may be swallowed or logged at the wrong level.
- **Per-instance behavior:** is it only some pods? (config drift, bad node, canary). Check load balancer + per-instance logs.
- **Intermittent dependencies:** DB/timeouts/circuit-breaker fallbacks returning errors; check downstream error rates.
- **Resource limits:** connection pool timeouts, thread pool rejections, OOM-killed pods restarting.
- **Correlation IDs + increase log level** on the failing path temporarily; capture request/response and headers.
- **Race conditions / concurrency** causing sporadic failures under load.

### Key point:

Add structured logging with correlation IDs and a global exception handler first; random 500s usually trace to a flaky dependency, resource exhaustion, or a concurrency bug on specific instances.

---

## A3: Response time keeps increasing over time, even though traffic is stable. What could be happening?

### Answer:

Gradual degradation under steady load points to a **leak or unbounded growth**:

- **Memory leak** → more frequent/longer GC pauses (watch heap-after-GC trending up).
- **Connection/thread leak** → pool slowly exhausts.
- **Unbounded cache/collection** growing without eviction.
- **Data growth:** a query with no index degrades as a table grows; missing pagination.
- **Fragmentation / open file descriptors / DB bloat** (e.g. missing vacuum).

Investigate with heap dumps (compare over time), GC logs, pool metrics, and DB table-size trends.

### Key point:

Steady traffic but rising latency ⇒ something accumulates — memory leak, leaking connections, an unbounded cache, or a query that degrades with data growth.

---

## A4: A database query works fine locally but is slow in production. How will you debug it?

### Answer:

The environments differ — focus on those differences:

1. **Data volume:** production has far more rows; a full scan that's fine on 100 rows is slow on millions. Run `EXPLAIN ANALYZE` in prod.
2. **Indexes:** verify the same indexes exist in prod; a missing index is the classic cause.
3. **Statistics / plan:** prod optimizer may pick a different plan; update statistics.
4. **Concurrency/locking:** prod has concurrent load and locks that local doesn't.
5. **Hardware/config:** different memory, cache hit ratio, connection pool sizing.
6. **Parameter sniffing / cache:** cold cache in prod.

### Key point:

Run `EXPLAIN ANALYZE` against production; the difference is almost always data volume + a missing index or a different execution plan, sometimes lock contention.

---

## A5: Multiple threads are causing inconsistent data updates. How will you fix it?

### Answer:

It's a race condition on shared mutable state. Options, from in-process to distributed:

- **Synchronization:** `synchronized`, `ReentrantLock`, or atomic classes (`AtomicInteger`, `LongAdder`) for in-JVM state.
- **Immutable / thread-safe structures:** `ConcurrentHashMap`, copy-on-write, immutable objects.
- **Database-level:** **optimistic locking** (`@Version`) to detect concurrent updates, or **pessimistic locking** (`SELECT ... FOR UPDATE`) to serialize.
- **Distributed lock** (Redis/Zookeeper) when multiple instances update the same resource.
- Reduce shared state; prefer message-driven single-writer designs.

```java
@Entity
class Account {
    @Id Long id;
    @Version Long version;   // optimistic lock: OptimisticLockException on conflict
    BigDecimal balance;
}
```

### Key point:

Identify the shared mutable state and pick the right scope: in-JVM synchronization/atomics for one instance, DB optimistic/pessimistic locking (or a distributed lock) across instances.

---

## A6: A memory issue crashes the application after a few hours. How will you identify the root cause?

### Answer:

Symptoms of a **memory leak** (heap grows until `OutOfMemoryError`):

1. **Enable GC logging** and monitor heap; a leak shows heap-after-full-GC steadily rising.
2. **Capture heap dumps** (`-XX:+HeapDumpOnOutOfMemoryError`, or `jmap`) and analyze with **Eclipse MAT/VisualVM** — look at the **dominator tree** for the biggest retained objects and their GC roots.
3. **Common culprits:** unbounded caches/collections, `ThreadLocal`s not cleared, static collections, unclosed resources, listeners/classloaders not released.
4. Reproduce under load; compare two dumps over time to see what grows.

### Key point:

Enable GC logs + heap dumps and use Eclipse MAT's dominator tree to find what's retained; typical leaks are unbounded caches, static/`ThreadLocal` references, or unclosed resources.

---

## A7: A service call blocks threads and leads to timeouts under load. What's your approach?

### Answer:

A slow synchronous downstream call ties up request threads until the pool is exhausted (thread starvation).

- **Set timeouts** on every remote call (connect + read).
- **Circuit breaker + bulkhead** (Resilience4j) to fail fast and isolate the dependency's thread pool.
- **Asynchronous / non-blocking I/O:** `CompletableFuture`, WebClient/WebFlux so threads aren't held during I/O.
- **Fallback / cached response** to degrade gracefully.
- **Tune pool sizes** and use backpressure; offload to a queue if not real-time.

### Key point:

Bound the blocking with timeouts, isolate it with a bulkhead + circuit breaker, and move to non-blocking I/O so slow dependencies can't exhaust the request thread pool.

---

## A8: Logs are present but still not enough to trace a request end-to-end. What will you implement?

### Answer:

- **Distributed tracing** with **OpenTelemetry / Micrometer Tracing**, exporting to **Jaeger/Zipkin**: a single **trace ID** propagated across all services, with spans per hop.
- **Correlation ID / MDC:** put the trace/request id into the logging MDC so every log line includes it; propagate it via headers (W3C `traceparent`/B3).
- **Structured (JSON) logging** shipped to a central store (ELK/Loki) so you can query by trace id.
- Log key checkpoints (entry, downstream calls, exit) at consistent levels.

```java
// MDC filter puts a correlation id on every log line
MDC.put("traceId", incomingTraceIdOrGenerate());
```

### Key point:

Add distributed tracing + a correlation id in the logging MDC, propagated across services, and centralize structured logs so a request can be followed end-to-end by trace id.

---

## A9: A deployment works in staging but breaks in production. What differences will you verify?

### Answer:

- **Config & secrets:** env vars, feature flags, DB URLs, credentials, different property profiles.
- **Data:** volume and shape (prod has more/edge-case data; missing indexes matter).
- **Scale & load:** concurrency, resource limits, autoscaling, pool sizes.
- **External dependencies:** prod endpoints, firewall/network rules, DNS, certificates.
- **Infra differences:** JVM/OS versions, memory limits, replica counts.
- **Migration state:** DB schema drift between environments.

Verify by diffing configuration, checking prod-specific logs/health, and confirming schema/migrations match.

### Key point:

"Works in staging" bugs are almost always environment differences — config/secrets, data volume, scale/limits, network access, or schema drift. Systematically diff prod vs staging.

---

## A10: A cache improves performance initially but later causes data inconsistency. How will you handle it?

### Answer:

Inconsistency = the cache is serving stale data after the source changed.

- **Invalidation on write:** evict/update the cache when the underlying data changes (`@CacheEvict`), ideally event-driven across instances.
- **Sensible TTLs:** bound staleness even if invalidation is missed.
- **Write-through / write-behind** to keep cache and DB aligned.
- **Distributed cache (Redis)** instead of per-instance caches, so all nodes see the same state (per-instance caches drift).
- **Versioned keys** to avoid stale reads; handle race between DB write and cache update carefully (e.g. delete-then-write ordering).

### Key point:

Stale-cache bugs are invalidation problems: invalidate/update on writes (event-driven), set TTLs as a safety net, and use a shared distributed cache so instances don't diverge.

---

# Section B — Core Java, JVM, Spring, Database & System Design Scenarios

## B1: HashMap has 1 million entries. Performance is degrading. Why and what do you do?

### Answer:

- **Repeated resizing/rehashing:** growing from default capacity to 1M causes many resize operations. **Pre-size** it: `new HashMap<>(expectedSize / 0.75 + 1)`.
- **Poor `hashCode()`:** if keys collide heavily, buckets degrade toward `O(n)` (or `O(log n)` after treeification). Ensure a well-distributed `hashCode()`.
- **Memory pressure:** 1M entries increase GC work; consider whether a different structure or an external store is better.
- **Concurrency:** if accessed by many threads, `HashMap` isn't safe — use `ConcurrentHashMap`.

### Key point:

Pre-size the map to avoid rehashing and ensure good `hashCode()` distribution; for concurrent access use `ConcurrentHashMap`.

---

## B2: Your code uses `synchronized` everywhere. Application is slow. What's wrong?

### Answer:

Over-synchronization serializes execution and kills concurrency — threads block waiting for locks (lock contention), and you lose the benefit of multiple cores.

Fixes:

- **Narrow the critical section:** synchronize only the minimal shared-state access, not whole methods.
- **Use finer-grained or lock-free constructs:** `ConcurrentHashMap`, atomic classes, `ReadWriteLock`/`StampedLock` (many readers, few writers), `ReentrantLock` with tryLock/timeout.
- **Reduce shared mutable state:** immutability, thread confinement, `ThreadLocal`.
- Avoid locking during I/O.

### Key point:

Blanket `synchronized` creates contention and serializes the app; minimize critical sections and prefer concurrent collections, atomics, and read-write locks.

---

## B3: Explain double-checked locking in Singleton. Why do you need `volatile`?

### Answer:

```java
class Singleton {
    private static volatile Singleton instance;

    static Singleton getInstance() {
        if (instance == null) {                 // 1st check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {         // 2nd check (with lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

`volatile` is required because `instance = new Singleton()` is **not atomic**: it (1) allocates memory, (2) runs the constructor, (3) assigns the reference. Without `volatile`, instruction reordering could publish the reference **before** the constructor finishes, so another thread could see a **partially constructed** object. `volatile` prevents that reordering and guarantees visibility across threads.

### Key point:

`volatile` stops reordering/visibility issues so no thread sees a half-initialized instance. (An enum or a static holder idiom is often a cleaner singleton.)

---

## B4: `ThreadLocal` variable in your app is causing a memory leak. How?

### Answer:

`ThreadLocal` values are stored in each `Thread`'s `ThreadLocalMap`, keyed by a **weak** reference to the `ThreadLocal` but with a **strong** reference to the **value**. In a **thread pool**, threads live for the app's lifetime, so values set on a pooled thread are **never garbage collected** unless explicitly removed — they accumulate across requests, leaking memory (and leaking data between requests).

Fix: always **`remove()`** in a `finally` block after use.

```java
try {
    context.set(value);
    // ... work
} finally {
    context.remove(); // essential with pooled threads
}
```

### Key point:

Pooled threads outlive requests, so un-`remove()`d `ThreadLocal` values are retained forever. Always clear `ThreadLocal`s in `finally`.

---

## B5: What is the difference between `wait()` and `sleep()`? Where would each cause a deadlock?

### Answer:

| | `wait()` | `sleep()` |
|---|---|---|
| Defined on | `Object` | `Thread` |
| Releases lock? | **Yes** — releases the monitor | **No** — holds any locks |
| Must hold monitor? | Yes (inside `synchronized`) | No |
| Wakes on | `notify()`/`notifyAll()` or timeout | timeout only |
| Purpose | thread coordination | pause execution |

- **`sleep()` deadlock risk:** sleeping **while holding a lock** blocks every other thread needing that lock; combined with another thread holding a second lock, you get classic lock-ordering deadlock.
- **`wait()` deadlock/lost-wakeup risk:** if `notify()` happens before `wait()`, or you `wait()` without a loop/condition, threads can wait forever. Always call `wait()` in a `while(condition)` loop.

### Key point:

`wait()` releases the monitor and needs a notify; `sleep()` keeps locks. Sleeping while holding locks and missed/lost notifications are the common paths to deadlock/hangs.

---

## B6: Your app ran fine for 30 days. Crashed with `OutOfMemoryError`. No code changes. What happened?

### Answer:

A slow **memory leak** or **unbounded growth** that only manifests after enough accumulation:

- Growing cache/collection/`ThreadLocal` with no eviction.
- Slowly accumulating data (sessions, listeners, classloader/metaspace leaks from repeated redeploys).
- External data growth pulling ever-larger result sets.
- It could also be **fragmentation** or a gradual native-memory/metaspace leak.

Diagnose with GC logs (heap-after-GC trend), heap dumps compared over time, and Eclipse MAT.

### Key point:

"Fine for weeks then OOM, no code change" is the signature of a slow leak/unbounded accumulation; confirm via GC-log heap trend and heap-dump analysis.

---

## B7: GC is running every 30 seconds. Application pauses for 2 seconds each time. How do you fix it?

### Answer:

Frequent GC with long pauses = high allocation rate and/or undersized/misconfigured heap.

1. **Analyze GC logs** to see if it's young or full GC and what's promoted.
2. **Reduce allocation:** avoid creating excessive short-lived objects, big temporary collections, autoboxing in hot loops.
3. **Tune heap:** right-size `-Xms/-Xmx`; if full GCs, the old gen may be too small or there's a near-leak.
4. **Switch collector:** use **G1GC** (pause-target `-XX:MaxGCPauseMillis`) or low-latency **ZGC/Shenandoah** for very low pauses.
5. Fix memory leaks that keep old gen full (forcing repeated full GCs).

### Key point:

Read GC logs first, then cut allocation and right-size the heap; use G1 (with a pause target) or ZGC/Shenandoah to eliminate multi-second stop-the-world pauses.

---

## B8: When would you choose G1GC over ZGC in production?

### Answer:

- **G1GC** (default): balanced throughput + pause times, mature, lower CPU/memory overhead. Good for **most** apps with **moderate heaps** (up to ~a few tens of GB) where ~tens-to-low-hundreds-of-ms pauses are acceptable.
- **ZGC:** designed for **very large heaps** (hundreds of GB–TB) and **ultra-low pause** requirements (sub-millisecond, mostly independent of heap size), at the cost of more CPU/memory overhead.

Choose **G1** when heaps are moderate and default balanced behavior is fine, or when you want lower resource overhead and broad compatibility. Choose **ZGC** when you need consistently tiny pauses on large heaps (latency-critical, big in-memory data).

### Key point:

G1 for moderate heaps and balanced throughput/pause with lower overhead; ZGC for huge heaps and strict ultra-low-latency requirements.

---

## B9: `@Transactional` on a private method. Why does it silently fail?

### Answer:

Spring's `@Transactional` works via **proxies (AOP)**. The proxy intercepts calls to **public** methods invoked **from outside** the bean. A **private** method (or an internal `this.method()` self-invocation) bypasses the proxy, so the transactional advice never runs — no transaction is started, and it fails silently (no error, just no transaction).

Fixes:

- Make the method **public** and call it **through the proxy** (from another bean).
- Or extract it into a **separate bean** so the call goes through the proxy.
- Or use `AopContext.currentProxy()` (less clean) / self-injection.

### Key point:

Proxy-based AOP only intercepts external calls to public methods; private methods and same-class self-invocation skip the proxy, so `@Transactional` does nothing.

---

## B10: Two beans of same type in Spring context. How does Spring decide which to inject?

### Answer:

By default injection is **by type**; two candidates of the same type cause `NoUniqueBeanDefinitionException`. Resolve with:

- **`@Primary`** on the preferred bean.
- **`@Qualifier("beanName")`** at the injection point to name the exact bean.
- **Match by name:** the field/parameter name matching a bean name is used as a fallback.
- **Inject all:** `List<MyType>` / `Map<String, MyType>` to get every bean.

```java
@Bean @Primary DataSource primaryDs() { ... }
@Bean @Qualifier("reporting") DataSource reportingDs() { ... }

public Service(@Qualifier("reporting") DataSource ds) { ... }
```

### Key point:

Spring injects by type; disambiguate multiple candidates with `@Primary` or `@Qualifier` (or bean-name matching), else it throws `NoUniqueBeanDefinitionException`.

---

## B11: Your `@Async` method throws an exception. Nobody catches it. What happens?

### Answer:

It depends on the return type:

- **`void` return:** the exception is **not propagated** to the caller (the caller already moved on). It's lost unless you configure an **`AsyncUncaughtExceptionHandler`** (via `AsyncConfigurer`).
- **`Future`/`CompletableFuture` return:** the exception is captured and rethrown (wrapped in `ExecutionException`) when you call `future.get()` / handle it with `.exceptionally()`.

```java
@Configuration
class AsyncConfig implements AsyncConfigurer {
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> log.error("Async error in {}", method, ex);
    }
}
```

### Key point:

For `void` `@Async` methods, uncaught exceptions vanish unless you register an `AsyncUncaughtExceptionHandler`; return `CompletableFuture` to observe/handle failures.

---

## B12: Spring Boot startup taking 45 seconds. How do you diagnose and fix it?

### Answer:

Diagnose:

- Enable **debug** / `ApplicationStartup` tracing (`BufferingApplicationStartup`) or `spring-boot-actuator` `startup` endpoint to see which phases/beans are slow.
- Check logs for slow **auto-configurations**, component scanning of huge packages, eager DB/cache/remote connections at startup, Flyway/Liquibase migrations, or classpath scanning.

Fix:

- **Lazy initialization** (`spring.main.lazy-initialization=true`) for beans not needed at boot.
- **Narrow component scanning**; exclude unused auto-configurations.
- Defer/parallelize expensive connections; avoid heavy work in `@PostConstruct`.
- Consider AOT/native (GraalVM) for extreme cases.

### Key point:

Use startup tracing/Actuator to find the slow beans/auto-configs, then apply lazy init, narrower scanning, and deferral of expensive connections/migrations.

---

## B13: Lazy loading throws `LazyInitializationException` in production but not in dev. Why?

### Answer:

The exception occurs when a **lazy** association is accessed **after the Hibernate session/transaction is closed** (no open persistence context). It appears in prod but not dev usually because of **`spring.jpa.open-in-view`**: it's enabled by default and keeps the session open through view rendering, masking the problem in dev; prod config, different request flow, or serialization outside the transaction exposes it.

Fixes:

- **Fetch what you need inside the transaction:** `JOIN FETCH`, `@EntityGraph`, or DTO projections.
- Keep access within the transactional boundary (service layer).
- Avoid relying on `open-in-view` (it's often disabled in prod for good reasons).

### Key point:

Lazy associations accessed outside an open session throw `LazyInitializationException`; `open-in-view` hides it in dev. Fix by eagerly fetching the needed data inside the transaction (`JOIN FETCH`/`@EntityGraph`/DTOs).

---

## B14: Your JPA query works fine with 100 rows. Takes 45 seconds with 1 million rows. What is wrong?

### Answer:

Likely the **N+1 query problem** and/or missing indexes/pagination:

- **N+1:** loading a collection lazily fires one query per parent — 1M rows ⇒ ~1M queries. Fix with `JOIN FETCH`/`@EntityGraph`/batch fetching.
- **No pagination:** loading all rows into memory; use `Pageable`/streaming.
- **Missing index** on filter/join columns ⇒ full scans that explode with size.
- **Fetching entities when a projection would do;** cartesian products from multiple joins.

Verify with SQL logging (`show-sql`, `hibernate.generate_statistics`) and `EXPLAIN ANALYZE`.

### Key point:

Scaling failure ⇒ almost always N+1, missing indexes, or lack of pagination. Enable SQL logging, fix fetching with `JOIN FETCH`/`@EntityGraph`, add indexes, and paginate.

---

## B15: Two transactions updating same row simultaneously. One silently overwrites the other. How do you prevent it?

### Answer:

This is the **lost update** problem. Prevent it with:

- **Optimistic locking:** a `@Version` column; on commit Hibernate checks the version and throws `OptimisticLockException` if it changed, so the second writer must retry with fresh data. Best for low-contention.
- **Pessimistic locking:** `SELECT ... FOR UPDATE` (`@Lock(PESSIMISTIC_WRITE)`) locks the row so the second transaction waits. Best for high-contention/critical writes.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select a from Account a where a.id = :id")
Account findForUpdate(@Param("id") Long id);
```

### Key point:

Prevent lost updates with optimistic locking (`@Version`, retry on conflict) for low contention, or pessimistic locking (`SELECT ... FOR UPDATE`) for high contention.

---

## B16: Your payment API receives same request twice due to network retry. How do you prevent double processing?

### Answer:

Make it **idempotent**:

- **Idempotency key:** client sends a unique key per logical request; server persists it with the result and **replays** the stored response on repeats. Store the key with a **unique constraint** so concurrent duplicates can't both insert.
- **Unique business constraint:** e.g. unique `(order_id, payment_attempt)`.
- **State machine:** only allow a payment to move `PENDING → CHARGED` once; reject re-processing of an already-charged payment.

```java
@PostMapping("/payments")
ResponseEntity<Payment> pay(@RequestHeader("Idempotency-Key") String key, @RequestBody Req r) {
    return store.find(key)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.ok(store.saveNew(key, service.charge(r))));
}
```

### Key point:

Use an idempotency key persisted with a unique constraint (plus a state machine) so a retried payment replays the original result instead of charging twice.

---

## B17: Microservice A calls B. B is down. A keeps retrying. B never recovers. What pattern solves this?

### Answer:

The **Circuit Breaker** pattern (plus sane retry policy). Aggressive retries pile load onto a struggling B (retry storm), preventing recovery. A circuit breaker **trips open** after a failure threshold and **fails fast** (returns a fallback) instead of hammering B, giving it time to recover; it moves to **HALF-OPEN** to probe before closing.

Combine with: bounded **retries with exponential backoff + jitter**, **timeouts**, and **bulkheads**.

```java
@CircuitBreaker(name = "serviceB", fallbackMethod = "fallback")
public Resp call() { return bClient.get(); }
public Resp fallback(Throwable t) { return Resp.cachedOrDefault(); }
```

### Key point:

Circuit breaker — fail fast when B is down so retries don't prevent its recovery; pair with backoff+jitter retries, timeouts, and bulkheads.

---

## B18: Your Redis cache is working. But database load is still at 100%. What is wrong?

### Answer:

Possible causes:

- **Low cache hit ratio:** keys not actually being hit — bad key design, too-short TTLs, or high cardinality (little reuse).
- **Cache stampede / thundering herd:** on expiry, many requests miss simultaneously and all hit the DB. Use locks/request coalescing and staggered TTLs.
- **Cache penetration:** requests for non-existent keys always miss and hit the DB. Cache negative results / use a bloom filter.
- **Writes dominate:** cache helps reads, not writes; if load is write-heavy, the DB stays busy.
- **Only part of the workload is cached;** expensive uncached queries remain.

Check Redis hit/miss ratio and slow query log to see what's actually hitting the DB.

### Key point:

A working cache doesn't help if the hit ratio is low or writes dominate. Investigate hit/miss ratio, stampede on expiry, and cache penetration — then fix key/TTL design.

---

## B19: API response time is 20ms normally. Spikes to 8 seconds under load. No errors in logs. Where do you start?

### Answer:

Large latency spike under load with no errors ⇒ **queuing/contention**, not failures:

1. **Thread/connection pool saturation:** requests queue waiting for a DB connection or worker thread. Check pool metrics and thread dumps.
2. **DB contention:** lock waits, slow queries amplified by concurrency.
3. **GC pauses** under load (allocation spikes).
4. **Downstream dependency** slowing under load.
5. **CPU saturation / no autoscaling headroom.**

Look at p99 latency, pool utilization, GC logs, and tracing to find where time is spent under load.

### Key point:

No errors + huge latency under load = resource contention/queuing (thread/connection pools, DB locks, GC). Inspect pool saturation, thread dumps, GC, and traces at peak.

---

## B20: New feature deployed Friday evening. By Monday morning everything is slow. Nobody touched code over weekend. What happened?

### Answer:

Gradual degradation over the weekend from steady operation ⇒ **accumulation introduced by the new feature**:

- **Resource leak:** memory/connection/thread leak slowly exhausting resources → GC thrash or pool exhaustion by Monday.
- **Unbounded data growth:** a new table/cache/log growing without cleanup; a query that slows as weekend data accumulates (missing index/pagination).
- **Scheduled job / batch** kicked off over the weekend interacting badly.
- **Log/disk filling up.**

Check heap/GC trend since Friday, connection pool usage, DB table growth, and disk usage.

### Key point:

Slow accumulation after a Friday deploy is a leak or unbounded growth in the new feature (memory/connection leak, or a query degrading with weekend data growth) — confirm via GC/heap trend, pool metrics, and table/disk growth.

---

# Section C — Concept & Design Deep-Dives

## C1: When would you choose ConcurrentHashMap instead of HashMap?

### Answer:

Use **ConcurrentHashMap** when the map is **accessed by multiple threads** concurrently and at least one mutates it. `HashMap` is not thread-safe — concurrent writes can corrupt it (infinite loops in Java 7, lost data, `ConcurrentModificationException`). `ConcurrentHashMap` provides thread-safe, high-concurrency access using CAS + bin-level synchronization (no global lock), and weakly-consistent iterators. Use plain `HashMap` for single-threaded or confined/immutable-after-publication use (it's faster with no synchronization overhead).

### Key point:

`ConcurrentHashMap` for concurrent read/write access; `HashMap` for single-threaded use where its lack of synchronization makes it faster.

---

## C2: What's the difference between `volatile`, `synchronized`, and `ReentrantLock`? Where would you use each?

### Answer:

- **`volatile`:** guarantees **visibility** and prevents reordering of a single variable across threads, but **no atomicity** for compound actions (`i++`). Use for simple flags/state published between threads (e.g. a `running` flag, double-checked locking reference).
- **`synchronized`:** provides **mutual exclusion + visibility** for a block/method via an intrinsic monitor. Simple, auto-released. Use for guarding compound operations on shared state.
- **`ReentrantLock`:** explicit lock with extra features — **tryLock** (with timeout), **interruptible** acquisition, **fairness**, and multiple **Condition** objects. Use when you need those capabilities; must `unlock()` in `finally`.

### Key point:

`volatile` = visibility only (single variable); `synchronized` = simple mutual exclusion; `ReentrantLock` = advanced locking (tryLock/timeout/fairness/conditions) at the cost of manual unlock.

---

## C3: How does ExecutorService help manage threads efficiently?

### Answer:

`ExecutorService` decouples task submission from thread management via a **thread pool**:

- **Reuses threads** instead of creating one per task (thread creation is expensive; unbounded threads cause OOM/context-switch thrash).
- **Bounds concurrency** with a fixed pool + a work queue, providing backpressure.
- Manages lifecycle (`submit`, `shutdown`, `awaitTermination`) and returns `Future`s.
- Configurable via `ThreadPoolExecutor` (core/max size, queue, rejection policy).

```java
ExecutorService pool = Executors.newFixedThreadPool(10);
Future<Integer> f = pool.submit(() -> compute());
pool.shutdown();
```

### Key point:

It pools and reuses threads, bounds concurrency (backpressure), and manages task lifecycle — avoiding the cost and risk of manually creating unbounded threads. Prefer a configured `ThreadPoolExecutor` over `Executors` factory methods in production.

---

## C4: Explain the complete Spring Boot request lifecycle from DispatcherServlet to the response.

### Answer:

1. Request hits the servlet container (embedded Tomcat) and is routed to the **`DispatcherServlet`** (front controller).
2. **`HandlerMapping`** finds the handler (controller method) for the URL.
3. Registered **filters** and then **`HandlerInterceptor.preHandle`** run.
4. **`HandlerAdapter`** invokes the controller method; **argument resolvers** bind `@RequestParam`/`@PathVariable`/`@RequestBody` (via `HttpMessageConverter`s), validation runs.
5. Controller returns a value; for REST, **`@ResponseBody`** + `HttpMessageConverter` serializes to JSON. For MVC, a **`ViewResolver`** renders a view.
6. **`postHandle`** / **`afterCompletion`** interceptors run; **`@ControllerAdvice`/`@ExceptionHandler`** handle exceptions.
7. Response is written back through the filter chain to the client.

### Key point:

`DispatcherServlet` → HandlerMapping → (filters/interceptors) → HandlerAdapter invokes controller (arg resolution, validation) → return value converted (message converter/view resolver) → interceptors/exception handling → response.

---

## C5: Why are Spring Beans Singleton by default? When would you choose another Bean Scope?

### Answer:

Singleton (one instance per container) is the default because most beans (services, repositories, controllers) are **stateless** and sharing one instance is memory-efficient and thread-safe by design. Other scopes:

- **prototype:** new instance per injection/lookup — for **stateful** or non-shareable beans.
- **request / session:** one per HTTP request / session (web apps) — for per-user/per-request state.
- **application / websocket:** per ServletContext / WebSocket session.

Choose non-singleton when the bean holds **mutable per-user/per-request state** that must not be shared.

### Key point:

Singletons suit stateless shared beans (efficient, thread-safe). Use prototype/request/session scopes when a bean carries mutable state that shouldn't be shared across callers.

---

## C6: What happens internally when a method is annotated with `@Transactional`?

### Answer:

Spring wraps the bean in an **AOP proxy**. When a transactional method is called, the proxy's `TransactionInterceptor`:

1. Asks the `PlatformTransactionManager` to **begin** (or join, per propagation) a transaction — opening a connection and setting autocommit off.
2. Binds the connection/`EntityManager` to the current thread.
3. Invokes the actual method.
4. On normal return → **commit**; on a **runtime (unchecked) exception** → **rollback** (checked exceptions don't roll back by default; configurable via `rollbackFor`).
5. Applies propagation (`REQUIRED`, `REQUIRES_NEW`, ...) and isolation settings.

### Key point:

A proxy intercepts the call, begins a transaction via the transaction manager, commits on success and rolls back on unchecked exceptions, honoring propagation/isolation.

---

## C7: Why doesn't `@Transactional` work when one method calls another method within the same class?

### Answer:

Because of **self-invocation**: an internal `this.otherMethod()` call does **not** go through the Spring proxy — it's a direct call on the target object — so the transactional advice is never applied to `otherMethod`. Proxies can only intercept calls that arrive **from outside** the bean.

Fixes: move the transactional method to a **separate bean**, inject and call it through the proxy; or use `AopContext.currentProxy()`; or self-inject the bean.

### Key point:

Same-class self-invocation bypasses the proxy, so the inner method's `@Transactional` is ignored. Call it via another bean/the proxy instead.

---

## C8: Why is Constructor Injection generally preferred over Field Injection?

### Answer:

- **Immutability:** dependencies can be `final`.
- **Mandatory dependencies guaranteed:** object can't be built in an invalid state.
- **Testability:** instantiate directly in unit tests with plain `new`, no reflection/container.
- **Explicit dependencies:** a long constructor signals too many responsibilities (a design smell field injection hides).
- **Fails fast** on missing/circular dependencies at startup.

Field injection hides dependencies, can't be `final`, and needs reflection or a context to test.

### Key point:

Constructor injection gives immutable, explicit, guaranteed, easily-testable dependencies; field injection hides them and hurts testability.

---

## C9: How would you design an API versioning strategy without affecting existing clients?

### Answer:

Keep old versions working while adding new ones. Common approaches:

- **URI versioning:** `/api/v1/...`, `/api/v2/...` — most explicit and common.
- **Header/media-type versioning:** `Accept: application/vnd.app.v2+json` — cleaner URLs.
- **Request-param versioning:** `?version=2` — simplest but less clean.

Principles: never break existing contracts (only make **backward-compatible** additions within a version — add optional fields, don't remove/rename), version only on breaking changes, **deprecate** old versions with clear timelines and communication, and run versions side by side.

### Key point:

Expose explicit versions (URI or media-type), keep changes backward-compatible within a version, and only bump the version for breaking changes — running old and new in parallel with a deprecation policy.

---

## C10: What makes an API idempotent? Explain using a real-world example.

### Answer:

An operation is **idempotent** if performing it multiple times yields the **same result/state** as performing it once. Safe methods: `GET`, `PUT`, `DELETE` are idempotent by design; `POST` generally is not.

**Real-world example:** an elevator "call" button — pressing it 5 times is the same as pressing once. In APIs: `PUT /account/123 {balance: 100}` sets the balance to 100 no matter how many times it's sent. A **payment** `POST` is made idempotent with an **idempotency key** so a retried charge doesn't bill the customer twice.

### Key point:

Idempotent = repeated identical requests have the same effect as one. `PUT`/`DELETE`/`GET` are naturally idempotent; make `POST` idempotent with an idempotency key.

---

## C11: When would you choose PUT over PATCH?

### Answer:

- **`PUT`** = **full replacement** of a resource; the client sends the **entire** representation. Idempotent. Use when replacing the whole resource or creating-at-a-known-id.
- **`PATCH`** = **partial update**; the client sends only the fields to change. Not necessarily idempotent (depends on semantics). Use when updating a subset of fields, especially for large resources where sending everything is wasteful.

Use `PUT` when you have and want to send the complete resource state; `PATCH` when applying a partial modification.

### Key point:

`PUT` replaces the whole resource (idempotent, send everything); `PATCH` updates part of it (send only changed fields).

---

## C12: How would you implement global exception handling in a Spring Boot application?

### Answer:

Use **`@RestControllerAdvice`** with **`@ExceptionHandler`** methods to centralize error handling and return consistent error responses (ideally RFC 7807 `ProblemDetail`).

```java
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ProblemDetail handleNotFound(EntityNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ProblemDetail handleValidation(MethodArgumentNotValidException ex) { ... }
}
```

Also consider extending `ResponseEntityExceptionHandler` for Spring MVC exceptions, and mapping each exception to the correct HTTP status with a consistent body.

### Key point:

Centralize with `@RestControllerAdvice` + `@ExceptionHandler`, mapping exceptions to proper HTTP statuses and a consistent error body (`ProblemDetail`).

---

## C13: How does indexing improve query performance, and when can an index become ineffective?

### Answer:

An index (usually a **B-tree**) lets the DB locate rows in `O(log n)` instead of scanning the whole table, and helps `WHERE`, `JOIN`, `ORDER BY`, and range queries.

**When an index becomes ineffective:**

- **Functions/expressions on the column:** `WHERE UPPER(name)=...` (unless a functional index exists).
- **Leading wildcard:** `LIKE '%abc'`.
- **Low selectivity:** column with few distinct values (e.g. boolean) — scan may be cheaper.
- **Type mismatch / implicit conversion.**
- **Not using the leftmost prefix** of a composite index.
- **Small tables** where a full scan is faster.
- Too many indexes also **slow writes** (each must be maintained).

### Key point:

Indexes turn scans into `O(log n)` lookups, but are bypassed by functions on the column, leading wildcards, low selectivity, type mismatches, or ignoring a composite index's leftmost prefix.

---

## C14: How would you identify and optimize a slow SQL query in Production?

### Answer:

1. **Find it:** slow query log / APM (Dynatrace, `pg_stat_statements`) to identify the worst queries.
2. **Explain it:** `EXPLAIN ANALYZE` to inspect the plan — look for seq scans, expensive sorts, nested loops on big tables, bad row estimates.
3. **Optimize:**
   - Add/adjust **indexes** on filter/join/sort columns; consider covering indexes.
   - **Rewrite** the query: avoid `SELECT *`, unnecessary joins/subqueries, `OR` that defeats indexes; add pagination.
   - Update **statistics**; fix data types.
   - Fix ORM issues (N+1) at the app layer.
   - Consider denormalization/materialized views/caching for heavy read paths.
4. **Verify** the new plan and measure.

### Key point:

Identify via slow-query log/APM, analyze with `EXPLAIN ANALYZE`, then add the right indexes / rewrite the query / paginate / update stats, and verify the improved plan.

---

## C15: What is the N+1 Query Problem, and how would you prevent it?

### Answer:

The **N+1 problem**: fetching N parent entities then lazily loading each one's association fires **1 (parents) + N (one per parent)** queries — killing performance at scale.

```java
List<Order> orders = orderRepo.findAll();      // 1 query
for (Order o : orders) o.getItems().size();    // N extra queries (one per order)
```

**Prevention:**

- **`JOIN FETCH`** in JPQL to load associations in one query.
- **`@EntityGraph`** on the repository method.
- **Batch fetching** (`@BatchSize` / `hibernate.default_batch_fetch_size`) to load associations in grouped `IN` queries.
- **DTO projections** selecting exactly what's needed.

### Key point:

N+1 = one query per parent for its association. Prevent with `JOIN FETCH`, `@EntityGraph`, batch fetching, or DTO projections; detect it by logging SQL.

---

## C16: Explain Optimistic Locking and Pessimistic Locking with practical use cases.

### Answer:

- **Optimistic locking:** assume conflicts are **rare**; don't lock. Use a **`@Version`** column checked at update time; if it changed, throw `OptimisticLockException` and the caller retries. Best for **low-contention, read-heavy** workloads (e.g. editing a user profile). High concurrency, no blocking.
- **Pessimistic locking:** assume conflicts are **likely**; **lock the row** (`SELECT ... FOR UPDATE`) so others wait. Best for **high-contention, critical** updates (e.g. debiting an account balance, inventory decrement) where a retry loop would be wasteful or unsafe. Risks blocking/deadlocks.

### Key point:

Optimistic (version + retry) for low-contention, high-throughput cases; pessimistic (row locks) for high-contention critical updates where you must serialize access.

---

## C17: Why would you choose a Microservices Architecture over a Monolithic Architecture?

### Answer:

Choose microservices when you need:

- **Independent scaling** of specific capabilities.
- **Independent deployment** and faster, autonomous team delivery.
- **Technology diversity** per service.
- **Fault isolation.**

But they add operational complexity, distributed-system challenges, and data-consistency issues. A **monolith** is better for **small teams/simple apps** (simpler to build, test, deploy). Many teams start monolith-first and extract services as scaling/organizational needs justify the cost.

### Key point:

Microservices pay off for large, evolving systems needing independent scaling/deployment and team autonomy; the trade-off is significant operational and distributed-systems complexity — prefer a monolith for smaller/simpler apps.

---

## C18: When would you use synchronous communication instead of asynchronous communication?

### Answer:

- **Synchronous (REST/gRPC):** use when the caller **needs an immediate response** to proceed — e.g. a query, validation, or a user-facing request that must return data now. Simpler to reason about, but creates temporal coupling (callee must be up) and cascading-failure risk.
- **Asynchronous (messaging/events):** use for **decoupling, resilience, and throughput** — fire-and-forget, background processing, event notification, load leveling — where an immediate response isn't required.

### Key point:

Synchronous when you need an immediate result and tight request/response semantics; asynchronous for decoupling, resilience, and background/high-throughput work.

---

## C19: Explain the Saga Pattern using an Order and Payment workflow.

### Answer:

A **Saga** manages a distributed transaction as a sequence of **local transactions**, each publishing an event that triggers the next; on failure, **compensating transactions** undo prior steps (no global 2PC).

**Order/Payment example (orchestration):**

1. `Order Service` creates the order (status `PENDING`).
2. `Payment Service` charges the customer.
3. `Inventory Service` reserves stock.
4. `Order Service` marks the order `CONFIRMED`.

If **payment fails**, compensate: cancel the order. If **inventory fails** after payment, compensate: **refund the payment** and cancel the order.

- **Choreography:** services react to each other's events.
- **Orchestration:** a central orchestrator coordinates steps + compensations.

### Key point:

Saga = chain of local transactions with compensating actions for rollback. E.g. if inventory can't be reserved after payment, a compensating refund + order cancel restores consistency without 2PC.

---

## C20: How would you prevent duplicate payment requests in a distributed system?

### Answer:

- **Idempotency key** per payment request, persisted with a **unique constraint**; on a duplicate, replay the stored result instead of charging again.
- **Deduplication** on a business key (`orderId`) with a unique index.
- **State machine:** a payment can transition to `CHARGED` only once; reject re-processing.
- **Exactly-once-ish consumption** for event-driven flows: idempotent consumers tracking processed event ids.
- **Outbox pattern** to avoid publishing duplicate payment events from dual writes.

### Key point:

Idempotency key + unique constraint (and a state machine / idempotent consumers) so retried or duplicated payment requests are detected and only processed once.

---

## C21: Why would you choose Kafka instead of RabbitMQ for a particular use case?

### Answer:

- **Kafka:** a distributed **log** — high-throughput streaming, **event replay** (messages retained and re-readable by offset), long retention, ordered per-partition, great for **event sourcing, analytics, stream processing, and many consumers** reading the same stream independently. Consumers pull and track offsets.
- **RabbitMQ:** a traditional **message broker** — flexible routing (exchanges), per-message ack, priorities, and **complex routing / task queues / RPC**; messages are typically removed after consumption.

Choose **Kafka** for high-volume event streams, replayability, and multiple independent consumer groups; choose **RabbitMQ** for complex routing, per-message workflows, and traditional task queues.

### Key point:

Kafka for high-throughput, retained/replayable event streams with many consumers; RabbitMQ for flexible routing and traditional queue/task semantics.

---

## C22: An API that usually responds in 200 ms is now taking 5 seconds. How would you investigate? Which metrics first?

### Answer:

**Investigation:** confirm scope (all vs one endpoint, all vs some users), correlate with recent deploys/traffic, then use tracing to find the dominant span, and thread dumps for blocking.

**Which layer — check these metrics first, in order:**

1. **Application:** latency p95/p99, throughput, thread pool usage, **GC pauses**, CPU/memory. High GC or thread saturation ⇒ app.
2. **Database:** connection pool usage, slow query log, lock waits, active sessions. ⇒ DB.
3. **Infrastructure:** host CPU/memory/disk I/O/network, pod restarts, autoscaling. ⇒ infra.
4. **External dependency:** latency/error rate of downstream/third-party calls (from traces). ⇒ dependency.

The **distributed trace** is the fastest way to attribute the 5s to a specific layer.

### Key point:

Correlate with change + use tracing to localize the slow span; check app metrics (GC, thread pool), then DB (pool, slow queries, locks), then infra, then external dependencies — the trace tells you which layer owns the latency.

---

# Section D — Java 8 Coding Questions

## D1: Remove duplicate elements from a collection and sort them using Java 8 Streams.

### Answer:

Use `distinct()` to remove duplicates and `sorted()` to order:

```java
List<Integer> numbers = List.of(5, 3, 9, 3, 1, 5, 9, 2);

List<Integer> result = numbers.stream()
        .distinct()          // remove duplicates
        .sorted()            // natural ascending order
        .collect(Collectors.toList());
// [1, 2, 3, 5, 9]

// Descending:
List<Integer> desc = numbers.stream()
        .distinct()
        .sorted(Comparator.reverseOrder())
        .collect(Collectors.toList());
// [9, 5, 3, 2, 1]
```

Alternatively, collect into a `TreeSet` (which both de-duplicates and sorts):

```java
Set<Integer> sortedUnique = new TreeSet<>(numbers);
```

### Key point:

`stream().distinct().sorted().collect(...)` — `distinct()` dedupes, `sorted()` orders (pass a `Comparator` for custom/descending order). A `TreeSet` achieves both in one step.

---

## D2: Sort a list of Employee objects by salary using Java 8 Comparator and Streams.

### Answer:

```java
record Employee(String name, double salary) {}

List<Employee> employees = List.of(
        new Employee("Alice", 75000),
        new Employee("Bob", 55000),
        new Employee("Carol", 95000));

// Ascending by salary
List<Employee> bySalary = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::salary))
        .collect(Collectors.toList());

// Descending by salary
List<Employee> bySalaryDesc = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::salary).reversed())
        .collect(Collectors.toList());

// Then-by: salary desc, then name asc (tie-breaker)
List<Employee> multi = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::salary).reversed()
                .thenComparing(Employee::name))
        .collect(Collectors.toList());
```

### Key point:

Use `Comparator.comparingDouble(Employee::salary)` (`.reversed()` for descending, `.thenComparing(...)` for tie-breakers) with `stream().sorted(...).collect(...)`.

---

## Evaluation Tips

- For debugging scenarios, strong candidates use **observability (metrics/logs/traces) and the change timeline**, mitigate first, and reason about *where time/resources go* rather than guessing.
- Watch for the resilience vocabulary: circuit breaker, bulkhead, timeout, idempotency, saga, optimistic/pessimistic locking, backpressure.
- For Spring questions, check understanding of **proxy-based AOP** (why `@Transactional`/`@Async` fail on self-invocation/private methods).
- For JVM/memory, check they can reason about **leaks, GC logs, and heap-dump analysis**.
- For coding questions, look for correct use of `distinct`/`sorted`/`Comparator` chaining and awareness of alternatives (`TreeSet`).
