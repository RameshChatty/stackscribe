# Chapter 24: Production Incident Playbook (Deep-Dive Troubleshooting)

## Overview

Twenty production-incident scenarios with **elaborated, root-cause-oriented answers** — the systematic checklist to follow, likely causes ranked by probability, the exact signals/commands to inspect, and the fix. Several scenarios overlap with Chapters 20–21; here the answers go deeper (diagnosis steps, tooling, and remediation) so this chapter works as a hands-on troubleshooting playbook.

> **Golden rule for every incident:** *stabilize/mitigate first (rollback, scale, shed load), then root-cause.* Lean on the change timeline + observability (metrics, logs, traces) instead of guessing.

---

## Q1: A customer reports duplicate orders. Where would you start investigating?

### Answer:

Duplicate orders almost always come from a **non-idempotent write path** being triggered more than once.

**Where to start — trace one concrete duplicate:**

1. **Pull the two order records** and compare timestamps, request IDs, user/session, source IP, and payloads. Are they milliseconds apart (retry) or minutes apart (user double-submit)?
2. **Follow the request in tracing/logs** by correlation ID. Look for:
   - **Client/browser double-submit** (double click, impatient refresh) — no client-side debounce/disable-on-submit.
   - **Automatic retries** — gateway, load balancer, HTTP client, or the mobile app retrying on a slow/timed-out response that actually succeeded server-side.
   - **At-least-once message delivery** — a Kafka/queue consumer reprocessing the same event (rebalance, redelivery, offset not committed).
   - **A failed-then-retried transaction** that partially committed.

**Root cause & fix — make the write idempotent:**

- **Idempotency key** per logical order, persisted with a **unique constraint**; on a duplicate key, replay the stored result instead of inserting again.
- **Natural unique constraint** on a business key (e.g. `cart_id`/`client_request_id`).
- **Idempotent consumers** (dedup on event ID) for the event-driven path.
- Client-side guard (disable submit, debounce) as defense in depth.

```java
@PostMapping("/orders")
ResponseEntity<Order> create(@RequestHeader("Idempotency-Key") String key, @RequestBody Req r) {
    return store.find(key).map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.status(CREATED).body(store.saveNew(key, service.create(r))));
}
```

### Key point:

Start by comparing the duplicate records and tracing one request to classify the source (client double-submit vs retry vs at-least-once redelivery), then fix the root cause with an idempotency key + unique constraint so retries replay instead of re-create.

---

## Q2: Your API latency jumps from 200ms to 5s after deployment. Why?

### Answer:

"After deployment" points strongly at the release; 25x latency with (usually) idle CPU means **waiting**, not computing.

**Investigate in order:**

1. **Diff the release** — what changed? A new/changed query, an added synchronous downstream call in a hot path, a config change (pool size, timeout), a new library, disabled cache, or a chatty ORM mapping.
2. **Distributed tracing** — find which span grew from ~0 to ~5s (DB? downstream service? external API?).
3. **Database** — enable slow-query log / `EXPLAIN ANALYZE`; a deploy commonly introduces an **N+1** (lazy association iterated) or drops/ignores an index, causing full scans.
4. **Thread/connection pools** — a small pool + a newly-slow dependency causes requests to **queue** (idle CPU, high latency). Check HikariCP `pending`, thread dump for `BLOCKED`/`WAITING`.
5. **GC** — a new allocation-heavy path can cause long pauses.

**Mitigate:** roll back the deploy (fastest), then fix the root cause (add index/`JOIN FETCH`, restore cache, raise pool/timeout).

### Key point:

Correlate with the deploy and use tracing to find the slow span; the usual post-deploy culprits are an N+1/missing-index query, a new synchronous downstream call, or pool queuing. Roll back to stabilize, then fix.

---

## Q3: A Kafka consumer is running, but messages are not being processed.

### Answer:

The consumer process is up, yet no progress — diagnose the consumption path.

**Checklist:**

1. **Consumer lag** — `kafka-consumer-groups --describe --group <g>`. Lag growing = not consuming; lag zero but "no processing" = maybe reading a different topic/partition than expected.
2. **Group / rebalance issues** — stuck in a rebalance loop, or all partitions assigned to a dead/other instance. Check for frequent `Rebalancing` logs; a long processing time exceeding `max.poll.interval.ms` causes the broker to evict the consumer, so it never commits and keeps reprocessing/stalling.
3. **Topic / partition mismatch** — wrong topic name, wrong `group.id`, or offset reset config (`auto.offset.reset=latest` skipping existing backlog).
4. **Poison message / blocked handler** — the handler throws or blocks on the first record (e.g. a downstream call hanging), so the poll loop can't advance. No error handler / DLQ configured.
5. **Deserialization errors** — a bad payload throwing on deserialize before your code runs.
6. **Offset already committed** — messages considered "processed"; nothing new arriving.

**Fix:** address the specific cause — tune `max.poll.records`/`max.poll.interval.ms`, add error handling + **dead-letter topic**, fix deserialization, correct topic/group config, and ensure offsets commit only after successful processing.

### Key point:

Check consumer lag, rebalance state, topic/group/offset config, and whether the handler is blocking or throwing (poison message/deserialization). A hung handler or a rebalance loop is the classic "running but not processing" cause; add a DLQ and tune poll settings.

---

## Q4: Users see stale data even though the database is updated.

### Answer:

Something is serving an **older copy** than the DB. Trace the read path from the browser inward and find the caching layer that isn't invalidated.

**Layers to check (outermost first):**

1. **Client / browser / CDN cache** — `Cache-Control`/`ETag` too aggressive; the response is cached at the edge. Verify with a hard refresh and response headers.
2. **Application cache (Redis/Caffeine)** — the entry wasn't **invalidated/updated** on write. Per-instance caches also **drift** across nodes (one instance updated, another didn't).
3. **Read replica lag** — writes go to primary, reads hit a **replica** that hasn't caught up (replication lag) — eventual consistency.
4. **ORM / session cache** — Hibernate first/second-level cache returning a stale entity.
5. **Write didn't commit** where the reader expects (transaction visibility/isolation).

**Fix:** invalidate/update caches on write (event-driven), set sane TTLs as a safety net, use a **shared distributed cache** instead of per-instance, read-your-writes from primary (or wait for replica catch-up) where consistency matters, and correct HTTP cache headers.

### Key point:

Stale reads are a cache-invalidation or replica-lag problem: find which layer (CDN/browser, app cache, read replica, ORM cache) serves the old value, then invalidate on write, use a shared cache with TTLs, and read from primary when you need read-your-writes consistency.

---

## Q5: A microservice works locally but returns 503 in production.

### Answer:

**503 Service Unavailable** means the service (or its gateway) can't handle the request *right now* — it's usually infrastructure/config, not business logic (which would be 500).

**Check:**

1. **Readiness/liveness probes** — failing readiness makes Kubernetes/the LB pull the pod out of rotation → 503 with "no healthy upstream." Check probe config and `/actuator/health`.
2. **No healthy instances** — pods crash-looping (bad config/secret, OOMKilled), failing to start, or still warming up.
3. **Config & secrets differences** — missing/incorrect env vars, DB URL/credentials, feature flags, wrong Spring profile — the service can't connect to its dependencies and reports down.
4. **Resource limits** — CPU/memory limits too low → throttling/OOMKill; connection pool can't reach the DB.
5. **Downstream dependency unreachable** — network policy/firewall/DNS blocks a dependency that's available locally; the service's health check fails.
6. **Gateway/mesh** — upstream timeouts or circuit breaker open at the gateway.

**Fix:** compare prod vs local config/secrets, inspect pod events/logs (`kubectl describe`/`logs`), fix probes/limits/network policies, and confirm dependency connectivity.

### Key point:

503 is an availability/infra problem: check readiness probes, crash-looping pods, config/secret and network-policy differences, and resource limits — "works locally" bugs are almost always environment differences (config, secrets, connectivity, limits).

---

## Q6: Thread count keeps increasing, but CPU remains low.

### Answer:

Rising threads + low CPU = threads are **blocked/waiting on I/O or locks**, and likely **not being released** (a thread leak).

**Diagnose:**

1. **Thread dump** (`jstack`, repeated a few times) — categorize states. Many `WAITING`/`TIMED_WAITING`/`BLOCKED` on the same monitor, socket read, or pool lock reveals the bottleneck.
2. **Where are they stuck?** Common causes:
   - **Blocking calls without timeouts** to a slow downstream — each request holds a thread indefinitely, so the pool grows / new threads spawn.
   - **Unbounded thread pool** (`Executors.newCachedThreadPool` or manual `new Thread()` per task) creating threads faster than they finish.
   - **Lock contention / deadlock** — threads waiting forever.
   - Leaked threads from libraries/schedulers not shut down.
3. Watch thread count trend vs request rate; correlate with a slow dependency.

**Fix:** add **timeouts** to every blocking call, use **bounded** thread pools with a rejection policy, apply **bulkhead + circuit breaker** to isolate slow dependencies, switch hot I/O paths to non-blocking, and ensure executors are properly shut down.

### Key point:

Low CPU + growing threads = threads blocked on I/O/locks and not released. Take thread dumps to find where they're stuck; fix with timeouts, bounded pools, bulkheads/circuit breakers, and non-blocking I/O.

---

## Q7: One service is down. How do you stop the failure from spreading?

### Answer:

Prevent a single failure from cascading into a system-wide outage (a down/slow dependency otherwise exhausts callers' threads and takes them down too).

**Resilience patterns (apply together):**

- **Circuit Breaker** (Resilience4j): after a failure threshold, trip **OPEN** and **fail fast** with a fallback instead of hammering the dead service; probe via **HALF-OPEN** before closing. Crucially, this also lets the failing service **recover** (no retry storm).
- **Timeouts** on every remote call — never block indefinitely.
- **Bulkhead** — isolate each dependency in its own thread/connection pool so one can't consume all resources.
- **Fallback / graceful degradation** — cached or default data, or a reduced feature set.
- **Bounded retries with exponential backoff + jitter** — only for idempotent, transient failures (aggressive retries make it worse).
- **Load shedding / rate limiting** to protect the core.
- **Async decoupling** — queue work so a down consumer doesn't fail the producer.

```java
@CircuitBreaker(name = "svcB", fallbackMethod = "fallback")
@Bulkhead(name = "svcB")
@TimeLimiter(name = "svcB")
public CompletableFuture<Resp> call() { return async(() -> bClient.get()); }
public CompletableFuture<Resp> fallback(Throwable t) { return completed(Resp.cached()); }
```

### Key point:

Contain it with circuit breaker + timeout + bulkhead + fallback (and bounded backoff retries), so callers fail fast and degrade gracefully while the downed service recovers instead of being buried by retries.

---

## Q8: Database connections are exhausted during peak traffic.

### Answer:

All pool connections are checked out; new requests wait and time out.

**Likely causes (ranked):**

1. **Connections held too long** — slow queries, or **long transactions** that make remote calls / do heavy work while holding a connection.
2. **Connection leaks** — not returned to the pool (missing try-with-resources / `open-in-view` keeping them through view rendering).
3. **Pool undersized** for peak concurrency — or, conversely, oversized so the DB itself is the bottleneck.
4. **Traffic spike / downstream slowdown** causing requests to pile up.

**Diagnose:** HikariCP metrics (`active`, `idle`, `pending`, `connectionTimeout`), enable **leak detection**, inspect DB for `idle in transaction` / long-running queries, take a thread dump.

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.leak-detection-threshold=60000
```

**Fix:** shorten transactions (never call remote APIs inside them), fix leaks, optimize slow queries/indexes, right-size the pool to the DB's capacity (more app instances × pool size must not exceed DB `max_connections`), add read replicas/caching to offload reads, and consider a proxy like PgBouncer.

### Key point:

Usually connections held too long (slow queries/long transactions) or leaked — not merely a small pool. Use pool metrics + leak detection, shorten transactions, fix leaks/queries, and size the pool to DB capacity; offload with caching/replicas.

---

## Q9: A retry mechanism creates duplicate payments.

### Answer:

A client/gateway/consumer retries a request that **actually succeeded** (the response was lost/slow), charging the customer twice.

**Fix — make payment processing idempotent and safe to retry:**

1. **Idempotency key** generated once per payment attempt by the client, sent on every retry. The server persists it (with the result) under a **unique constraint**; a duplicate key **replays the original response** instead of charging again.
2. **State machine** — a payment can transition to `CHARGED` only once; reject re-processing of an already-charged payment.
3. **Idempotent consumers** for event-driven payment flows (dedup on event ID); **exactly-once** semantics where the broker supports it.
4. **Only retry idempotent, transient failures** with bounded backoff; never blindly retry a timeout without idempotency protection.
5. **Reconciliation** with the payment provider (they often support idempotency keys too) to catch/settle any duplicates.

```java
if (!processed.markIfNew(idempotencyKey)) return existingResult(idempotencyKey); // dedup
Payment p = gateway.charge(request, idempotencyKey); // pass key to PSP too
```

### Key point:

Retries are inevitable — make the payment idempotent with a persisted idempotency key + unique constraint (and a state machine), pass the key to the payment provider, and reconcile. Then a retried charge replays the original result instead of double-charging.

---

## Q10: Logs show success, but users receive errors.

### Answer:

A mismatch between what the server *thinks* happened and what the user *experiences* — the error is happening **outside** the code path you're logging.

**Where to look:**

1. **Downstream of the app log** — the app returns 200 to the gateway/LB/CDN, but that layer transforms it, times out, or fails afterward (e.g. response too large, gateway timeout shorter than app processing, TLS/compression issue).
2. **Client-side errors** — frontend JS error, response schema mismatch, CORS failure, serialization producing invalid JSON the client rejects. Server logged "success" but the client couldn't use it.
3. **Async/after-commit failures** — you log success at controller return, but a post-response step (async job, event publish, second write) fails and the user's later view is wrong.
4. **Partial success** — the primary write succeeded (logged) but a secondary step (email, cache update, downstream call) failed and surfaces as a user error.
5. **Wrong instance/version** — you're reading logs from a healthy instance while a bad canary/instance serves the failing users.
6. **Logging gaps** — errors caught and swallowed, or logged at a level you're not viewing.

**Fix:** add **end-to-end distributed tracing** with correlation IDs spanning gateway → app → downstream → (ideally) client RUM; check gateway/LB access logs and status codes; log at the true boundaries; capture client-side errors.

### Key point:

The failure is outside your logged path — check the gateway/LB/CDN layer, client-side/serialization/CORS errors, async post-response steps, and per-instance/version differences. End-to-end tracing + gateway logs + client RUM reveal the gap between "server success" and "user error."

---

## Q11: Why might a Spring Boot application suddenly consume more memory?

### Answer:

**Sudden** vs **gradual** matters — sudden jumps usually correlate with an event.

**Common causes:**

1. **Traffic / load increase** — more concurrent requests, larger sessions, bigger thread pools → more heap.
2. **Large result sets / unbounded queries** — a query now returns far more rows (data growth, missing pagination), loading huge lists into memory; file uploads/exports buffered in memory.
3. **Cache growth** — an unbounded or misconfigured cache accumulating entries.
4. **Memory leak** — objects retained (static collections, `ThreadLocal` in pooled threads, listeners/classloaders); heap-after-GC trends up.
5. **New feature/library** — a recent deploy added an allocation-heavy path or a library with a large footprint.
6. **Config change** — larger heap/`-Xmx`, batch sizes, connection pools, or Hibernate caching.
7. **Metaspace growth** — dynamic class/proxy generation (e.g. lots of runtime proxies), or repeated redeploys leaking classloaders.

**Diagnose:** GC logs + heap trend, heap dump analyzed in **Eclipse MAT** (dominator tree), Actuator/Micrometer memory metrics, correlate with deploy/traffic timeline.

### Key point:

Distinguish load-driven growth (traffic, large result sets, bounded-but-bigger caches) from a leak (rising heap-after-GC, static/`ThreadLocal`/classloader retention). Use GC logs + heap-dump (MAT) and the deploy/traffic timeline to pinpoint it.

---

## Q12: An API works for 100 users but fails for 10,000 users.

### Answer:

A **scalability/contention** problem exposed only under load; individual requests are fine, but shared/finite resources saturate.

**Bottlenecks to examine:**

1. **Database** — connection pool exhaustion, lock contention, and queries that are fine on small data/low concurrency but degrade (missing indexes, N+1 multiplied by 10k, full scans). Usually the first bottleneck.
2. **Thread / connection pools** — requests queue when pools saturate → latency spikes/timeouts (idle CPU, growing latency).
3. **Memory / GC** — higher concurrency → more allocation → GC pressure/pauses, possibly OOM.
4. **Synchronization / locks** — a `synchronized` section or a hot lock serializes requests, killing throughput.
5. **Downstream limits** — a third-party API or shared service rate-limits or slows under the aggregate load.
6. **No horizontal scaling / stateful design** — a single instance or in-memory session state that can't scale out.

**Fix:** load test to find the actual bottleneck; add indexes/fix N+1, right-size pools, cache hot reads, reduce lock scope, make the service **stateless** and scale horizontally (autoscaling), add rate limiting/backpressure, and use async where appropriate.

### Key point:

Under 10k users a finite/shared resource saturates — most often the database (pools, locks, N+1, missing indexes), then thread pools, GC, and hot locks. Load test to locate it, then optimize queries, scale statelessly, cache, and reduce contention.

---

## Q13: A cache improves performance but introduces inconsistencies.

### Answer:

Classic **cache-consistency** trade-off: the cache serves data that no longer matches the source of truth.

**Why inconsistencies arise:**

- **Missing/late invalidation** on writes — the cache keeps the old value.
- **Per-instance caches drift** — one node updates, others don't.
- **Race conditions** between DB write and cache update (e.g. update cache then DB write fails, or a concurrent read repopulates a stale value between delete and write).
- **TTL too long** for volatile data.

**Strategies:**

- **Invalidate/update on write** — `@CacheEvict`/`@CachePut`; broadcast invalidation events so all instances evict (Redis pub/sub, Spring Cloud Bus).
- **Prefer a shared distributed cache** (Redis) over per-instance caches to avoid drift.
- **Right-size TTLs** as a safety net; shorter for volatile data.
- **Correct write ordering** — commonly **write DB, then delete cache** (cache-aside), and handle the read-repopulation race (e.g. short TTL, versioned keys, delayed double-delete).
- Accept **eventual consistency** where acceptable; use write-through for tighter coupling.
- Don't cache highly volatile/critical-consistency data (e.g. account balance) without care.

### Key point:

Inconsistency is an invalidation/coherence problem: invalidate or update on writes (broadcast across instances), use a shared cache, set sensible TTLs, order writes carefully (write-DB-then-evict) to avoid stale repopulation, and pick eventual vs strong consistency deliberately per data type.

---

## Q14: A scheduled job runs twice unexpectedly.

### Answer:

Almost always because **multiple instances** each run their own scheduler, or the scheduler misfires.

**Causes:**

1. **Horizontal scaling** — `@Scheduled` runs on **every** instance; with N replicas the job fires N times. The #1 cause.
2. **Overlapping executions** — a long-running job whose next trigger fires before the previous finishes (no overlap guard).
3. **Misfire/retry after restart** — a rebalancing scheduler (e.g. after a deploy) re-triggers.
4. **Clock/timezone or cron misconfiguration.**

**Fix — ensure single execution across the cluster:**

- **Distributed lock / leader election** — **ShedLock** (`@SchedulerLock`) so only one instance runs each execution; or Quartz in clustered mode; or a leader-election mechanism.
- **Idempotent jobs** — design the job so running twice is harmless (dedup, upserts, marking processed rows).
- Prevent overlap (`fixedDelay` vs `fixedRate`, or a run-lock).
- Run the scheduler on a **single dedicated instance/profile** if appropriate.

```java
@Scheduled(cron = "0 0 * * * *")
@SchedulerLock(name = "reportJob", lockAtMostFor = "PT10M")
public void generateReport() { ... } // only one instance across the cluster runs it
```

### Key point:

Multiple replicas each running `@Scheduled` is the usual cause. Guarantee single execution with a distributed lock (ShedLock)/leader election or clustered Quartz, prevent overlap, and make the job idempotent so a double-run is harmless.

---

## Q15: Health checks are green, but customers report outages.

### Answer:

The health check is **too shallow** — it reports "up" while the real user path is broken (a false negative for the outage).

**Why this happens:**

1. **Liveness-only / trivial checks** — `/health` returns 200 as long as the process is alive, without checking **dependencies** (DB, cache, downstream services, message broker).
2. **Dependency down but not in the check** — the DB or a critical downstream is failing; requests error, but the health endpoint doesn't test it.
3. **Partial outage** — only some endpoints/features fail, some instances, or one region; aggregate health looks fine.
4. **Health check hits a different path** than real traffic (cached, or bypasses auth/business logic).
5. **Downstream of the app** — gateway/LB/DNS/CDN issue; the app is healthy but users can't reach it.

**Fix:** use **readiness checks that verify critical dependencies** (Spring Boot Actuator health indicators for DB, Redis, downstream), add **deep/synthetic checks** that exercise the real user journey, monitor **actual user-facing SLOs** (error rate, latency from the edge) and **business metrics** (orders/min), not just process liveness, and add **real-user monitoring** + external synthetic probes.

### Key point:

Green health checks that miss outages are too shallow. Make readiness checks verify real dependencies, add synthetic checks of the true user journey, and alert on edge-observed SLOs and business KPIs — process-liveness alone doesn't prove the system works for customers.

---

## Q16: One slow query starts affecting the entire application.

### Answer:

A single slow query causes disproportionate damage because it **holds shared resources**, starving everything else.

**Why it spreads:**

- Each execution **holds a DB connection** for its whole duration; enough concurrent slow executions **exhaust the connection pool**, so *unrelated* requests can't get a connection and time out.
- It can hold **locks**, blocking other transactions on the same rows/tables.
- It consumes DB CPU/IO/buffer cache, slowing **all** queries.
- Threads waiting on it pile up in the app (thread starvation).

**Diagnose:** slow-query log / `pg_stat_activity` (or equivalent) for long-running queries and lock waits; `EXPLAIN ANALYZE` (look for seq scans, bad plans); HikariCP `pending`/`active`; thread dump showing threads blocked on the DB.

**Fix:**
- Optimize the query — add/adjust **indexes**, rewrite it, paginate, fix N+1.
- Add a **statement/query timeout** so a runaway query is killed instead of holding resources.
- **Bulkhead/isolate** heavy queries (separate pool/read replica) so they can't starve the primary path.
- Circuit-break/queue expensive operations; cache their results.

### Key point:

A slow query monopolizes shared resources (connections, locks, DB CPU), starving the whole app. Find it via slow-query log + `EXPLAIN ANALYZE`, fix with indexing/rewrite/pagination, and add statement timeouts + resource isolation (separate pool/replica) so one query can't take everything down.

---

## Q17: Why can `@Transactional` fail to roll back changes?

### Answer:

Several well-known reasons the rollback silently doesn't happen:

1. **Checked exception thrown** — by default Spring rolls back only on **unchecked** (`RuntimeException`/`Error`). A thrown **checked** exception **commits** unless you set `@Transactional(rollbackFor = Exception.class)`.
2. **Exception caught/swallowed** — if you catch the exception inside the method and don't rethrow, the proxy never sees it, so it commits. (Rolling back requires the exception to propagate out, or a manual `setRollbackOnly()`.)
3. **Self-invocation / private method** — calling the `@Transactional` method via `this.method()` from the same class, or annotating a **private** method, bypasses the **proxy**, so no transaction (and thus no rollback) is ever applied.
4. **Non-public method** — proxy-based `@Transactional` only applies to **public** methods.
5. **Wrong propagation** — e.g. a nested call with `REQUIRES_NEW` commits independently; or the code isn't actually running in the transaction you think.
6. **Non-transactional engine/datasource** — e.g. MyISAM tables, or DDL that auto-commits, or multiple datasources without a shared transaction manager.
7. **Transaction manager misconfiguration** — the operation runs outside Spring's managed transaction.

**Fix:** use `rollbackFor` for checked exceptions, don't swallow exceptions, call transactional methods **from another bean** (through the proxy) and keep them **public**, verify propagation, and ensure a transactional storage engine + correctly configured `PlatformTransactionManager`.

### Key point:

The common reasons: a **checked exception** (no rollback by default), a **caught/swallowed** exception, **self-invocation/private/non-public** methods bypassing the proxy, wrong propagation, or a non-transactional engine/misconfigured manager. Use `rollbackFor`, let exceptions propagate, and invoke via the proxy on public methods.

---

## Q18: How would you investigate a production memory leak?

### Answer:

A methodical approach:

1. **Confirm it's a leak** — enable **GC logging** (`-Xlog:gc*`) and watch **heap usage after full GC** over time. A true leak shows a steadily rising post-GC baseline (not just saw-tooth); eventually `OutOfMemoryError`.
2. **Capture heap dumps** — `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=...`, or on demand with `jmap -dump:live,format=b,file=heap.hprof <pid>`. Take **two dumps over time** to compare growth.
3. **Analyze** with **Eclipse MAT** (or VisualVM/JProfiler): use the **Leak Suspects report** and **dominator tree** to find the objects retaining the most memory and follow **GC-root reference chains** to see *what* keeps them alive.
4. **Identify the usual culprits:**
   - Unbounded **caches**/collections (no eviction).
   - **`ThreadLocal`** not cleared in pooled threads.
   - **Static** collections/singletons accumulating.
   - Unclosed resources (streams, connections), listeners/callbacks not deregistered.
   - **ClassLoader/metaspace** leaks (repeated redeploys, dynamic classes).
5. **Reproduce** in staging under load if possible; correlate with a recent deploy.
6. **Fix & verify** — bound the cache/clear the `ThreadLocal`/close resources, then confirm the post-GC heap flattens.

**Tooling in prod:** Micrometer/Actuator memory metrics, continuous profilers (async-profiler, JFR — Java Flight Recorder), APM (Dynatrace).

### Key point:

Confirm via GC-log post-GC heap trend, capture and diff heap dumps, and use Eclipse MAT's dominator tree/leak suspects to trace GC roots to the retaining objects — typically unbounded caches, uncleared `ThreadLocal`s, static references, or classloader leaks. Fix and verify the heap flattens.

---

## Q19: Your application restarts repeatedly in Kubernetes.

### Answer:

A **crash loop** (`CrashLoopBackOff`) — the pod starts, fails/gets killed, and Kubernetes restarts it repeatedly.

**Diagnose first:** `kubectl describe pod` (events, last state, exit code, reason) and `kubectl logs --previous` (logs from the crashed container).

**Common causes:**

1. **OOMKilled (exit 137)** — memory usage exceeds the container **memory limit**; the kernel kills it. Heap `-Xmx` set above the limit, or a leak. Fix: right-size limits **and** JVM heap (use container-aware flags / `-XX:MaxRAMPercentage`), fix leaks.
2. **Failing liveness probe** — probe too aggressive / initial delay too short for a slow-starting app → Kubernetes keeps killing a healthy-but-slow pod. Fix: tune `initialDelaySeconds`/`timeout`/`failureThreshold`, use **startup probes**.
3. **Startup failure** — missing/invalid **config or secret**, unreachable dependency (DB) at boot, port conflict, bad migration → app exits non-zero. Fix: correct config/secrets, make startup resilient, check dependency availability.
4. **Uncaught fatal error** on boot (bad env, incompatible version).
5. **Insufficient CPU** causing slow start that trips probes.

**Fix:** read the events + previous logs to get the exit code/reason, then address the specific cause (limits/heap, probe tuning, config/secret/dependency at startup).

### Key point:

It's a crash loop — inspect `kubectl describe` events + `logs --previous` for the exit code. The top causes are **OOMKilled** (limit vs `-Xmx` mismatch/leak), an over-aggressive **liveness probe** on a slow start (use startup probes), and **startup failures** from missing config/secrets or unreachable dependencies.

---

## Q20: What's the first thing you check during a production incident?

### Answer:

**First: assess impact/scope and stabilize — not root cause.**

A practical order:

1. **Scope & severity** — who/what is affected (all users or some, which service/region, error rate, revenue impact)? Check the top-level dashboards (error rate, latency, traffic, saturation — the **four golden signals**).
2. **"What changed?"** — the single highest-value question. Recent **deploy**, config/feature-flag change, infra change, or traffic surge? Most incidents follow a change; check the deployment/change timeline.
3. **Mitigate fast** — if a recent change correlates, **roll back** (or disable the feature flag, scale out, shed load) to restore service **before** deep debugging.
4. **Communicate** — declare the incident, assign an incident commander, keep stakeholders/status page updated.
5. **Then diagnose** — use metrics → traces → logs to localize the failing layer (app/DB/infra/dependency), fix root cause, and verify recovery.
6. **Afterwards** — blameless postmortem and follow-up actions.

### Key point:

First determine **impact/scope** via the golden-signal dashboards and ask **"what changed?"**, then **mitigate immediately** (rollback/flag/scale) to restore service — root-causing comes after stabilization and clear incident communication.

---

## Evaluation Tips

- Strong candidates **stabilize before root-causing**, and always ask **"what changed?"** first.
- They reason about **where finite/shared resources saturate** (connection pools, threads, locks, DB) rather than guessing.
- Look for correct classification: **503/infra & config** vs **500/app**, **OOMKilled** vs probe-kill, **stale cache vs replica lag**, **checked-exception/self-invocation** for `@Transactional` rollback.
- The best answers pair a **diagnosis method** (metrics → traces → logs, thread/heap dumps, `EXPLAIN ANALYZE`, `kubectl describe`) with a concrete **fix** (idempotency keys, circuit breaker/bulkhead, indexing, ShedLock, right-sized limits/heap).
