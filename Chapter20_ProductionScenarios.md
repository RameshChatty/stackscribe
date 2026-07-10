# Chapter 20: Production-Level Scenario Questions

## Overview

This chapter covers 20 production-level scenario questions that assess how a candidate operates a real system in production — investigating incidents, preventing cascading failures, scaling under load, and building resilient, observable services. Each question includes a structured answer with concrete steps, patterns, and code/config examples where applicable.

---

## Question 1: Your API response time suddenly increases from 200ms to 5 seconds in production. How would you investigate?

### Answer:

Investigate systematically, from the outside in, using data rather than guesses.

1. **Confirm scope:** Is it all endpoints or one? All users/regions or some? Sudden spike vs gradual? Check dashboards (latency p50/p95/p99, error rate, throughput).
2. **Correlate with change:** Recent deploy, config/feature-flag change, or traffic spike? Check the deployment timeline first — most incidents follow a change.
3. **Layer-by-layer:**
   - **App:** CPU, memory, GC pauses (long GC = latency), thread pool saturation, blocked threads (thread dump).
   - **Database:** slow query log, missing index, lock contention, connection pool exhaustion.
   - **Downstream:** slow third-party/microservice call, DNS, network latency.
   - **Infrastructure:** noisy neighbor, disk I/O, autoscaling not keeping up.
4. **Use tracing:** Distributed tracing (Zipkin/Jaeger) to find which span dominates the 5s.
5. **Mitigate then fix:** roll back the suspect change or scale out to restore service, then root-cause.

### Key point:

Lead with observability (metrics, logs, traces) and the change timeline; mitigate first (rollback/scale), root-cause second.

---

## Question 2: One microservice is down, and dependent services are failing. How would you prevent a cascading failure?

### Answer:

A single failing service should not take down its callers. Apply resilience patterns:

- **Circuit Breaker** (Resilience4j): stop calling a failing dependency, fail fast, return a fallback.
- **Timeouts:** never block indefinitely on a downstream call.
- **Bulkhead:** isolate resources (separate thread pools/connection pools per dependency) so one slow dependency can't exhaust all threads.
- **Fallback / graceful degradation:** serve cached or default data instead of erroring.
- **Retry with backoff + jitter:** only for idempotent, transient failures — never aggressive retries (they amplify load).

```java
@CircuitBreaker(name = "pricing", fallbackMethod = "priceFallback")
@Bulkhead(name = "pricing")
@TimeLimiter(name = "pricing")
public CompletableFuture<Price> getPrice(String sku) {
    return CompletableFuture.supplyAsync(() -> pricingClient.get(sku));
}

public CompletableFuture<Price> priceFallback(String sku, Throwable t) {
    return CompletableFuture.completedFuture(Price.cachedOrDefault(sku));
}
```

### Key point:

Combine circuit breaker + timeout + bulkhead + fallback so failures are contained and callers degrade gracefully.

---

## Question 3: How would you handle a sudden traffic spike of 10x normal load?

### Answer:

- **Horizontal autoscaling:** scale out stateless services (Kubernetes HPA on CPU/RPS/custom metrics). Pre-scale if the spike is predictable (sales, launches).
- **Caching:** CDN for static/edge content; Redis for hot data to shield the database.
- **Load shedding & rate limiting:** reject/queue excess requests to protect the core rather than crashing everything.
- **Asynchronous processing:** offload non-critical work to a queue (Kafka/SQS) and process it later.
- **Database protection:** read replicas, connection pooling, avoid N+1; consider a write buffer.
- **Graceful degradation:** disable expensive non-essential features under load.

### Key point:

Scale out the stateless tier, cache aggressively, shed/queue excess load, and protect the database — the usual bottleneck.

---

## Question 4: Database connection pool is exhausted. What could be the reasons and how would you troubleshoot it?

### Answer:

### Common causes:

- **Connection leaks:** connections not closed (missing try-with-resources / not returned to pool).
- **Long-running / slow queries** holding connections.
- **Pool too small** for the concurrency level.
- **Traffic spike** or a downstream slowdown causing requests to pile up.
- **Long transactions** (e.g. calling a remote API inside an open transaction).

### Troubleshooting:

1. Check pool metrics (HikariCP: `active`, `idle`, `pending`, `connectionTimeout`).
2. Enable **leak detection** (`spring.datasource.hikari.leak-detection-threshold`).
3. Inspect DB for active/idle-in-transaction sessions and slow queries.
4. Take a thread dump to see where threads are waiting.

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.leak-detection-threshold=60000
```

### Key point:

Usually a leak or slow query, not too-small a pool. Fix leaks, shorten transactions/queries, and size the pool to DB capacity — don't just blindly increase it.

---

## Question 5: A REST API is creating duplicate records due to retries. How would you make it idempotent?

### Answer:

Make repeated identical requests produce the same result as a single request.

- **Idempotency key:** client sends a unique `Idempotency-Key` header; the server stores it and returns the previous response if the key is seen again.
- **Natural unique constraint:** enforce uniqueness at the DB (unique index on a business key) so duplicates are rejected.
- **Upsert semantics:** `INSERT ... ON CONFLICT DO NOTHING/UPDATE`.
- Design write endpoints so `PUT` (by id) is naturally idempotent; guard `POST`.

```java
@PostMapping("/orders")
public ResponseEntity<Order> create(@RequestHeader("Idempotency-Key") String key,
                                    @RequestBody OrderRequest req) {
    return idempotencyStore.find(key)
        .map(saved -> ResponseEntity.ok(saved))          // replay stored result
        .orElseGet(() -> {
            Order order = orderService.create(req);
            idempotencyStore.save(key, order);            // atomic with unique constraint
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        });
}
```

### Key point:

Use an idempotency key persisted with a unique constraint so retries replay the original result instead of creating duplicates.

---

## Question 6: How would you implement rate limiting in a microservices architecture?

### Answer:

- **Where:** at the **API Gateway** (Spring Cloud Gateway, Kong, NGINX) for global limits, and/or per-service for fine-grained control.
- **Algorithms:** **Token bucket** / **leaky bucket** (allow bursts, smooth rate), **sliding window** (accurate counts), **fixed window** (simple but bursty at edges).
- **Distributed state:** use **Redis** so the limit is shared across all service instances (e.g. Redis + Lua for atomic token-bucket, or Bucket4j/Resilience4j RateLimiter).
- **Keying:** by API key, user id, IP, or tenant.
- **Response:** return HTTP `429 Too Many Requests` with `Retry-After` and rate-limit headers.

```yaml
# Spring Cloud Gateway (Redis token bucket)
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter.replenishRate: 100   # tokens/sec
      redis-rate-limiter.burstCapacity: 200
```

### Key point:

Enforce at the gateway with a Redis-backed token/sliding-window limiter so limits are consistent across instances; return `429` + `Retry-After`.

---

## Question 7: Users report intermittent failures, but logs show nothing obvious. What would be your debugging approach?

### Answer:

1. **Improve observability first:** ensure structured logging with **correlation/trace IDs**, and add distributed tracing so a single failing request can be followed across services.
2. **Reproduce & correlate:** gather exact timestamps, user ids, request ids from complaints; correlate with metrics (error/latency spikes) and deploys.
3. **Look for intermittent-failure signatures:**
   - Only some instances (bad node, config drift, canary).
   - Timeouts/retries on a flaky dependency.
   - Race conditions / concurrency bugs.
   - GC pauses or resource saturation at intervals.
   - DNS/load-balancer/connection resets.
4. **Increase log level** temporarily for the affected path; add metrics around suspected code.
5. **Check tail latencies (p99)** — averages hide intermittent problems.

### Key point:

"Nothing in logs" usually means insufficient instrumentation — add correlation IDs/tracing, examine p99 and per-instance metrics, and hunt for flaky dependencies or concurrency issues.

---

## Question 8: How would you ensure zero downtime deployment?

### Answer:

- **Rolling deployment:** replace instances gradually behind a load balancer; new pods must pass **readiness probes** before receiving traffic.
- **Blue-Green:** run two environments; switch traffic to the new one instantly, roll back by switching back.
- **Canary:** route a small % of traffic to the new version, watch metrics, then ramp up.
- **Graceful shutdown:** stop accepting new requests, drain in-flight ones (Spring Boot `server.shutdown=graceful`), deregister from discovery.
- **Backward-compatible changes:** especially DB migrations — use **expand/contract** (add nullable column → deploy code → backfill → remove old) so old and new versions run simultaneously.
- **Health checks + automated rollback** on failure.

### Key point:

Rolling/blue-green/canary deploys + readiness probes + graceful shutdown + backward-compatible (expand/contract) DB migrations.

---

## Question 9: How would you handle partial failure in a distributed transaction?

### Answer:

Avoid distributed 2PC (poor availability/scalability); prefer eventual consistency patterns.

- **Saga pattern:** break the transaction into local transactions, each with a **compensating action** to undo previous steps on failure.
  - **Choreography:** services react to each other's events (no central coordinator).
  - **Orchestration:** a central orchestrator drives the steps and compensations.
- **Outbox pattern:** write the business change and an event atomically to the same DB, then publish the event reliably (avoids the dual-write problem).
- **Idempotency + retries** for transient failures; **dead-letter queues** for poison messages.

```text
Order Saga (orchestration):
  createOrder -> reserveInventory -> chargePayment -> confirmOrder
  If chargePayment fails: compensate -> releaseInventory -> cancelOrder
```

### Key point:

Use Sagas with compensating transactions (plus the outbox pattern for reliable event publishing) instead of 2PC; embrace eventual consistency.

---

## Question 10: One database query suddenly becomes slow after deployment. What steps would you take?

### Answer:

1. **Check what changed:** the deploy may have altered the query, added an ORM change (e.g. new join causing N+1), or removed an index.
2. **Run `EXPLAIN`/`EXPLAIN ANALYZE`** to see the execution plan — is it doing a full table scan instead of an index scan?
3. **Statistics / plan changes:** stale statistics or a changed plan can flip the optimizer; run `ANALYZE`/update stats.
4. **Data growth:** the table may have crossed a size threshold where a missing index now hurts.
5. **Locking/contention:** check for blocking transactions.
6. **Fix:** add/restore the appropriate index, rewrite the query, add pagination, or fix the ORM (`JOIN FETCH`/`@EntityGraph`).

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 123 AND status = 'OPEN';
-- Look for: Seq Scan (bad) vs Index Scan (good); high rows / cost
```

### Key point:

Use `EXPLAIN ANALYZE` to inspect the plan; the usual culprits after a deploy are a missing/unused index, an ORM-introduced N+1, or stale statistics.

---

## Question 11: How would you design a caching strategy for a high-traffic application?

### Answer:

- **Layers:** client/browser cache → CDN (edge) → application cache (Caffeine, in-process) → distributed cache (Redis) → database.
- **Patterns:**
  - **Cache-aside (lazy loading):** app checks cache, loads from DB on miss, populates cache. Most common.
  - **Write-through / write-behind:** write to cache and DB together / asynchronously.
- **Eviction & TTL:** LRU/LFU with sensible TTLs; keep hot data warm.
- **Invalidation:** the hard part — invalidate/update on writes; use versioned keys or event-based invalidation.
- **Avoid pitfalls:**
  - **Cache stampede/thundering herd:** use locks/`singleflight`, request coalescing, or staggered TTLs.
  - **Hot keys:** shard or replicate.
  - **Cache penetration:** cache negative results for missing keys.

```java
@Cacheable(value = "products", key = "#id")
public Product getProduct(Long id) { return repo.findById(id).orElseThrow(); }

@CacheEvict(value = "products", key = "#p.id")
public void update(Product p) { repo.save(p); }
```

### Key point:

Multi-layer cache (CDN → Redis → local), cache-aside for reads, careful invalidation on writes, and guard against stampedes/hot keys/penetration.

---

## Question 12: What happens when Kafka consumers are slower than producers?

### Answer:

Kafka retains messages on disk (per retention config), so messages are **not lost immediately**, but **consumer lag** grows — consumers fall behind the latest offset. If lag exceeds retention (time/size), unconsumed messages get **deleted** and are lost.

### How to handle it:

- **Monitor consumer lag** (Kafka lag metrics / Burrow / `consumer-groups --describe`).
- **Scale consumers:** add consumers in the group — but parallelism is capped by the **number of partitions**, so increase partitions if needed.
- **Increase throughput per consumer:** batch processing, async/parallel handling within a partition, tune `max.poll.records`, offload heavy work.
- **Backpressure:** ensure processing keeps up before committing offsets; avoid committing before work is done (prevents loss).
- Increase retention as a buffer while fixing the root cause.

### Key point:

Messages buffer on the broker and lag grows; scale consumers up to the partition count and increase per-consumer throughput before retention expires and data is lost.

---

## Question 13: How would you prevent duplicate event processing in an event-driven architecture?

### Answer:

Kafka and most brokers give **at-least-once** delivery, so consumers must be **idempotent**.

- **Idempotent consumer:** track processed event ids (dedup table / Redis set) and skip already-seen ids.
- **Idempotent operations:** design the effect to be safe to apply twice (upserts, set-to-value instead of increment).
- **Deduplication key:** use a business/event id with a unique constraint.
- **Exactly-once where supported:** Kafka transactions + idempotent producer (`enable.idempotence=true`) for read-process-write within Kafka.
- **Outbox pattern** on the producer side to avoid publishing duplicates from dual writes.

```java
@KafkaListener(topics = "payments")
public void handle(PaymentEvent e) {
    if (!processedRepo.markIfNew(e.getEventId())) return; // dedup, unique constraint
    paymentService.apply(e);
}
```

### Key point:

Assume at-least-once delivery; make consumers idempotent via a dedup key/processed-id store (or Kafka exactly-once semantics where applicable).

---

## Question 14: How would you secure communication between microservices?

### Answer:

- **Transport security:** **mTLS** (mutual TLS) so both services authenticate each other and traffic is encrypted; often handled by a **service mesh** (Istio/Linkerd).
- **Authentication/authorization:** short-lived **JWT/OAuth2** tokens (client-credentials flow) validated at each service; propagate identity via tokens, not trust-by-network.
- **API Gateway:** central authentication, token validation, and rate limiting at the edge.
- **Zero-trust / network policies:** restrict which services can talk to which (Kubernetes NetworkPolicies), private networks/VPC.
- **Secrets management:** Vault / cloud secret managers — never hardcode credentials.
- **Principle of least privilege** for each service's scopes.

### Key point:

mTLS for encryption + service identity, OAuth2/JWT for authz, a gateway for edge auth, and zero-trust network policies with proper secrets management.

---

## Question 15: How would you trace a request across multiple microservices?

### Answer:

Use **distributed tracing**:

- A **trace ID** is generated at the entry point and **propagated** through all downstream calls via headers (W3C `traceparent`, or B3 headers). Each service adds **spans** (units of work) under the same trace.
- **Instrumentation:** Spring Cloud Sleuth / **Micrometer Tracing** auto-inject and propagate IDs; **OpenTelemetry** is the vendor-neutral standard.
- **Backends:** **Jaeger**, **Zipkin**, Tempo, or commercial APM (Datadog, New Relic) to visualize the end-to-end trace and latency per span.
- Include the trace/correlation ID in all **logs** so logs and traces can be joined.

```
Client --traceparent--> Gateway --> OrderSvc --> [PaymentSvc, InventorySvc]
   (one trace ID, many spans; view the full waterfall in Jaeger)
```

### Key point:

Propagate a trace ID across services (OpenTelemetry/Micrometer Tracing), collect spans in Jaeger/Zipkin, and log the trace ID to correlate logs with traces.

---

## Question 16: How would you handle configuration changes without restarting services?

### Answer:

- **Centralized config server:** **Spring Cloud Config**, Consul, or a cloud parameter store holds config externally.
- **Dynamic refresh:** Spring `@RefreshScope` beans reload config on a `/actuator/refresh` call; **Spring Cloud Bus** (over Kafka/RabbitMQ) broadcasts refresh events to all instances at once.
- **Feature flags:** tools like LaunchDarkly/Unleash to toggle behavior at runtime without redeploy.
- **Kubernetes:** mount config as **ConfigMaps/Secrets**; many apps watch for file changes and reload.
- **Externalize** everything environment-specific so config changes never require a rebuild.

```java
@RefreshScope
@Component
class RateConfig {
    @Value("${feature.max-retries}")
    private int maxRetries; // updated on /actuator/refresh
}
```

### Key point:

Externalize config (Config Server/ConfigMaps) and use `@RefreshScope` + Spring Cloud Bus or feature flags to apply changes at runtime without restarts.

---

## Question 17: What would you do if a third-party API starts timing out frequently?

### Answer:

- **Timeouts:** set aggressive connect/read timeouts so your threads aren't held hostage.
- **Circuit breaker:** trip open after repeated failures and fail fast with a fallback.
- **Retries with exponential backoff + jitter:** only for idempotent calls and transient errors; cap attempts.
- **Fallback / degrade:** serve cached/last-known-good data or a default response.
- **Bulkhead:** isolate calls to the third party in a separate thread pool so they can't exhaust your whole app.
- **Async / queue:** if not real-time, queue the work and retry later.
- **Alerting & vendor escalation:** monitor their error rate; raise with the vendor and check their status page/SLA.

```java
@Retry(name = "vendor")
@CircuitBreaker(name = "vendor", fallbackMethod = "cached")
public Rate fetch() { return vendorClient.getRate(); }
public Rate cached(Throwable t) { return rateCache.lastKnownGood(); }
```

### Key point:

Protect yourself with timeouts + circuit breaker + bulkhead + bounded backoff retries, and degrade to cached/fallback data while escalating to the vendor.

---

## Question 18: How would you implement circuit breaker and fallback mechanisms?

### Answer:

Use **Resilience4j** (the modern replacement for Netflix Hystrix). The breaker tracks failures and moves between **CLOSED → OPEN → HALF-OPEN** states, short-circuiting calls when a dependency is unhealthy and invoking a fallback.

```java
@Service
class InventoryService {

    @CircuitBreaker(name = "inventory", fallbackMethod = "fallback")
    public String check(String sku) {
        return inventoryClient.check(sku);
    }

    private String fallback(String sku, Throwable t) {
        return "UNAVAILABLE"; // cached/default response
    }
}
```

```yaml
resilience4j.circuitbreaker.instances.inventory:
  slidingWindowSize: 20
  failureRateThreshold: 50          # open when >50% fail
  waitDurationInOpenState: 10s      # then try HALF-OPEN
  permittedNumberOfCallsInHalfOpenState: 3
```

### Key point:

Resilience4j `@CircuitBreaker` with a tuned failure threshold + wait duration, plus a `fallbackMethod` returning cached/default data; combine with timeouts and retries.

---

## Question 19: How would you monitor application health in production?

### Answer:

- **Health checks:** **Spring Boot Actuator** `/actuator/health` with liveness/readiness probes wired to Kubernetes.
- **Metrics:** **Micrometer → Prometheus**, visualized in **Grafana** (latency p50/p95/p99, error rate, throughput, JVM/GC, thread pools, DB pool).
- **Logs:** centralized structured logging (ELK/EFK, Loki) with correlation IDs.
- **Tracing:** OpenTelemetry + Jaeger for request flows.
- **Alerting:** Prometheus Alertmanager / PagerDuty on SLO breaches (error budget, latency, saturation).
- **The "four golden signals":** latency, traffic, errors, saturation. Also RED (Rate, Errors, Duration) and USE (Utilization, Saturation, Errors) methods.
- **Synthetic checks & real-user monitoring** for end-to-end visibility.

### Key point:

Actuator health + Micrometer/Prometheus/Grafana metrics + centralized logs + tracing + alerting on the four golden signals (latency, traffic, errors, saturation).

---

## Question 20: What metrics would you track for a critical business service?

### Answer:

### Technical metrics (the four golden signals):

- **Latency:** p50/p95/p99 response times (track tail latency, not just averages).
- **Traffic/throughput:** requests per second.
- **Errors:** error rate (5xx, timeouts), by endpoint.
- **Saturation:** CPU, memory, thread pool usage, DB connection pool usage, queue depth, consumer lag.

### Reliability / SLO metrics:

- **Availability / uptime**, **SLO compliance** and **error budget** burn rate.
- **Apdex** score.

### Business / domain metrics:

- Orders placed, payments succeeded/failed, sign-ups, revenue per minute, checkout conversion — the KPIs that reflect actual business impact.
- **Failed transactions** and their monetary value.

### Key point:

Track the four golden signals (latency, traffic, errors, saturation) **and** SLO/error-budget metrics **and** business KPIs — a critical service must be monitored for both technical health and business outcomes.

---

## Evaluation Tips

- Strong candidates **mitigate first, root-cause second**, and lean on observability (metrics, logs, traces) rather than guessing.
- Look for the resilience vocabulary: circuit breaker, bulkhead, timeout, retry-with-backoff, idempotency, saga, backpressure.
- For scaling/caching answers, check they identify the **database as the usual bottleneck** and protect it.
- For data questions (idempotency, duplicate events, distributed transactions), check they understand **at-least-once delivery** and **eventual consistency**.
- The best answers tie technical monitoring back to **business impact and SLOs**.
