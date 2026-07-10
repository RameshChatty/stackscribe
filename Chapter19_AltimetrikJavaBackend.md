# Chapter 19: Altimetrik Java Backend Developer Interview Questions (≈4 Years Experience)

## Overview

This chapter contains 20 Java Backend Developer interview questions that have been asked in Altimetrik interviews for candidates with around 4 years of experience. The focus is on **Core Java, Java 8, Spring Boot, Microservices, SQL, and System Design** rather than scenario-based questions. Each question includes a detailed answer with code examples where applicable.

---

## Question 1: Explain the internal working of HashMap. How does it handle collisions?

### Answer:

A `HashMap` stores key-value pairs in an array of "buckets". The bucket index for a key is derived from its hash code.

1. `hashCode()` is called on the key.
2. HashMap applies an internal hashing (perturbation) function to spread the bits: `(h = key.hashCode()) ^ (h >>> 16)`.
3. The bucket index is computed as `(n - 1) & hash`, where `n` is the array length (always a power of two).

```java
Map<String, Integer> map = new HashMap<>();
map.put("apple", 1);   // bucket = (n-1) & hash("apple")
map.put("banana", 2);
Integer value = map.get("apple"); // recompute bucket, then equals() to find entry
```

### Handling collisions:

When two keys map to the same bucket, HashMap chains them:

- **Java 7:** collisions are stored as a singly linked list in the bucket.
- **Java 8+:** a bucket starts as a linked list, but when the number of entries in a single bucket exceeds `TREEIFY_THRESHOLD` (8) **and** the table size is at least `MIN_TREEIFY_CAPACITY` (64), the list is converted into a **balanced red-black tree**. This improves worst-case lookup from `O(n)` to `O(log n)`. It reverts to a list when the count drops below `UNTREEIFY_THRESHOLD` (6).

### Key points:

- Default initial capacity is 16, default load factor is 0.75.
- When `size > capacity * loadFactor`, the map **resizes** (doubles capacity) and **rehashes** entries.
- Both `hashCode()` (bucket location) and `equals()` (entry match within a bucket) are used to find a key.

---

## Question 2: What is the difference between HashMap, ConcurrentHashMap, and Hashtable?

### Answer:

| Feature | HashMap | Hashtable | ConcurrentHashMap |
|---|---|---|---|
| Thread-safe | No | Yes (fully synchronized) | Yes (fine-grained) |
| Locking | None | Locks entire map | Bucket/bin-level (CAS + synchronized on bins) |
| Null keys/values | 1 null key, many null values | Not allowed | Not allowed |
| Performance | Fastest (single thread) | Slow (global lock) | Fast under concurrency |
| Introduced | 1.2 | 1.0 (legacy) | 1.5 |

```java
Map<String, Integer> hm = new HashMap<>();            // not thread-safe
Map<String, Integer> ht = new Hashtable<>();          // legacy, whole-map lock
Map<String, Integer> chm = new ConcurrentHashMap<>(); // concurrent, no null
```

### Key points:

- `Hashtable` synchronizes every method on the whole object — poor scalability.
- `ConcurrentHashMap` (Java 8+) uses CAS operations and synchronizes only on individual bins, allowing high read/write concurrency without locking the entire structure.
- Iterators of `ConcurrentHashMap` are **weakly consistent** (no `ConcurrentModificationException`), whereas `HashMap` iterators are **fail-fast**.
- Prefer `ConcurrentHashMap` over `Hashtable` or `Collections.synchronizedMap()` in concurrent code.

---

## Question 3: What are the differences between ArrayList and LinkedList? When would you use each?

### Answer:

| Aspect | ArrayList | LinkedList |
|---|---|---|
| Backing structure | Dynamic array | Doubly linked list |
| Random access `get(i)` | `O(1)` | `O(n)` |
| Insert/remove at end | Amortized `O(1)` | `O(1)` |
| Insert/remove in middle | `O(n)` (shifting) | `O(1)` if node known, else `O(n)` to find |
| Memory | Contiguous, less overhead | Extra node pointers per element |
| Implements | List, RandomAccess | List, Deque, Queue |

```java
List<Integer> arrayList = new ArrayList<>();  // fast indexed reads
List<Integer> linkedList = new LinkedList<>(); // fast head/tail ops, can be a Deque
```

### When to use each:

- **ArrayList:** default choice; use when you do frequent random access / iteration and mostly append. Better cache locality.
- **LinkedList:** use when you do many insertions/deletions at the head or tail (e.g., queue/deque), and rarely need random access.

In practice `ArrayList` is preferred most of the time; `ArrayDeque` is usually a better queue/stack than `LinkedList`.

---

## Question 4: Explain the Java Memory Model (Heap, Stack, Metaspace, and Garbage Collection).

### Answer:

The JVM divides memory into several regions:

- **Heap:** stores all objects and arrays. Shared across threads. Divided into:
  - **Young Generation** (Eden + two Survivor spaces) — new objects; minor GC happens here.
  - **Old (Tenured) Generation** — long-lived objects; major/full GC happens here.
- **Stack:** one per thread; stores method frames, local primitives, and object references. Automatically freed when a method returns. `StackOverflowError` on deep recursion.
- **Metaspace** (Java 8+, replaced PermGen): stores class metadata. It grows in **native memory** rather than the heap, avoiding many old `OutOfMemoryError: PermGen space` issues.
- **PC Register** and **Native Method Stack:** per-thread bookkeeping for the current instruction and native calls.

### Garbage Collection:

GC automatically reclaims heap objects that are no longer reachable from GC roots (stack references, static fields, etc.).

- **Minor GC:** cleans the Young Generation. Objects surviving several cycles are promoted to Old Gen.
- **Major/Full GC:** cleans the Old Gen (and often the whole heap) — more expensive, causes longer pauses.
- Common collectors: **G1** (default since Java 9), **Parallel**, **ZGC** and **Shenandoah** (low-latency).

```bash
# Common tuning flags
-Xms512m -Xmx2g              # initial / max heap
-XX:MetaspaceSize=128m       # metaspace sizing
-XX:+UseG1GC                 # select G1 collector
```

---

## Question 5: What are the differences between String, StringBuilder, and StringBuffer?

### Answer:

| Aspect | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Mutability | Immutable | Mutable | Mutable |
| Thread-safe | Yes (immutable) | No | Yes (synchronized) |
| Performance | Slow for many edits | Fastest | Slower than StringBuilder |
| Introduced | 1.0 | 1.5 | 1.0 |

```java
// String is immutable — concatenation creates new objects
String s = "a";
s = s + "b"; // new String object each time

// StringBuilder — mutable, not synchronized (single-threaded)
StringBuilder sb = new StringBuilder();
sb.append("a").append("b");

// StringBuffer — mutable, synchronized (multi-threaded)
StringBuffer sbf = new StringBuffer();
sbf.append("a").append("b");
```

### Key points:

- `String` is immutable, so it is safe to share and is used as HashMap keys; it benefits from the **String Pool** (string literals are interned).
- Use `StringBuilder` for string manipulation in a single thread (the common case).
- Use `StringBuffer` only when the same builder is shared across threads.

---

## Question 6: Explain the equals() and hashCode() contract. Why is it important?

### Answer:

The contract between `equals()` and `hashCode()` states:

1. If `a.equals(b)` is `true`, then `a.hashCode() == b.hashCode()` **must** be true.
2. If `a.hashCode() == b.hashCode()`, `equals()` may still be `false` (hash collision is allowed).
3. `equals()` must be reflexive, symmetric, transitive, and consistent.

```java
class Employee {
    private int id;
    private String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee e = (Employee) o;
        return id == e.id && Objects.equals(name, e.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}
```

### Why it is important:

Hash-based collections (`HashMap`, `HashSet`, `HashTable`) use `hashCode()` to find the bucket and `equals()` to find the entry. If you override `equals()` but not `hashCode()`, two "equal" objects can land in different buckets, so you would be unable to retrieve a value you just stored:

```java
Map<Employee, String> map = new HashMap<>();
map.put(new Employee(1, "A"), "x");
map.get(new Employee(1, "A")); // returns null if hashCode() not overridden!
```

---

## Question 7: What are functional interfaces in Java 8? Give examples.

### Answer:

A **functional interface** is an interface with exactly one abstract method (SAM — Single Abstract Method). It can be implemented with a lambda expression or method reference. The `@FunctionalInterface` annotation enforces this at compile time (it may still have `default`/`static` methods).

```java
@FunctionalInterface
interface Calculator {
    int operate(int a, int b);
}

Calculator add = (a, b) -> a + b;
System.out.println(add.operate(2, 3)); // 5
```

### Built-in examples (`java.util.function`):

| Interface | Abstract method | Purpose |
|---|---|---|
| `Predicate<T>` | `boolean test(T)` | condition / filter |
| `Function<T,R>` | `R apply(T)` | transform |
| `Consumer<T>` | `void accept(T)` | consume, no return |
| `Supplier<T>` | `T get()` | supply, no input |
| `BiFunction<T,U,R>` | `R apply(T,U)` | two-arg transform |
| `UnaryOperator<T>` | `T apply(T)` | same-type transform |

```java
Predicate<Integer> isEven = n -> n % 2 == 0;
Function<String, Integer> length = String::length;
Supplier<LocalDate> today = LocalDate::now;
Consumer<String> printer = System.out::println;
```

---

## Question 8: Explain Java 8 Streams. What is the difference between map() and flatMap()?

### Answer:

The **Stream API** processes sequences of elements in a functional, declarative style with intermediate (lazy) and terminal operations.

```java
List<String> names = List.of("alice", "bob", "carol");
List<String> result = names.stream()
        .filter(n -> n.length() > 3)   // intermediate
        .map(String::toUpperCase)      // intermediate
        .collect(Collectors.toList()); // terminal
// [ALICE, CAROL]
```

### map() vs flatMap():

- **`map()`** transforms each element into exactly one element — a one-to-one mapping. If each element becomes a collection, you get a stream of collections (`Stream<List<X>>`).
- **`flatMap()`** transforms each element into a **stream** and then flattens all those streams into a single stream — a one-to-many mapping.

```java
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));

// map -> Stream<List<Integer>> (still nested)
nested.stream().map(list -> list);

// flatMap -> Stream<Integer> (flattened)
List<Integer> flat = nested.stream()
        .flatMap(List::stream)
        .collect(Collectors.toList()); // [1, 2, 3, 4]
```

Use `flatMap()` whenever a mapping produces multiple values per input (e.g., splitting sentences into words, flattening nested lists, or `Optional` chaining).

---

## Question 9: What is the difference between findFirst(), findAny(), and anyMatch() in Streams?

### Answer:

- **`findFirst()`** returns an `Optional` of the **first** element in encounter order. Deterministic even in parallel streams.
- **`findAny()`** returns an `Optional` of **any** element; in a parallel stream it may return any matching element for better performance. In a sequential stream it usually behaves like `findFirst()`.
- **`anyMatch(Predicate)`** returns a **boolean** — `true` if at least one element matches the predicate. It short-circuits.

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5);

Optional<Integer> first = nums.stream()
        .filter(n -> n > 2)
        .findFirst();            // Optional[3]

Optional<Integer> any = nums.parallelStream()
        .filter(n -> n > 2)
        .findAny();              // Optional[some element > 2]

boolean hasEven = nums.stream()
        .anyMatch(n -> n % 2 == 0); // true
```

### Key difference:

`findFirst()`/`findAny()` return the **element** (as `Optional`); `anyMatch()` returns a **boolean** indicating existence. Use `anyMatch()` when you only care whether a match exists.

---

## Question 10: Explain the lifecycle of a Spring Bean.

### Answer:

A Spring bean goes through the following phases managed by the IoC container:

1. **Instantiation** — the container creates the bean instance.
2. **Populate properties** — dependencies are injected.
3. **Aware interfaces** — `BeanNameAware`, `BeanFactoryAware`, `ApplicationContextAware` callbacks.
4. **`BeanPostProcessor.postProcessBeforeInitialization()`**.
5. **Initialization callbacks** — `@PostConstruct`, then `InitializingBean.afterPropertiesSet()`, then a custom `init-method`.
6. **`BeanPostProcessor.postProcessAfterInitialization()`** — where AOP proxies are typically created.
7. **Bean is ready for use.**
8. **Destruction** — on container shutdown: `@PreDestroy`, then `DisposableBean.destroy()`, then a custom `destroy-method`.

```java
@Component
public class MyBean {

    @PostConstruct
    public void init() {
        System.out.println("Bean initialized");
    }

    @PreDestroy
    public void cleanup() {
        System.out.println("Bean being destroyed");
    }
}
```

### Key points:

- Default scope is **singleton** (one instance per container). For **prototype** beans, Spring does not manage destruction.
- `@PostConstruct` and `@PreDestroy` are the most common, annotation-based hooks.

---

## Question 11: What is Dependency Injection? How does Spring Boot implement it?

### Answer:

**Dependency Injection (DI)** is a design pattern (a form of Inversion of Control) where an object's dependencies are supplied by an external container rather than the object creating them itself. This promotes loose coupling and testability.

Spring implements DI through its **IoC container**. Beans are registered (via `@Component`/`@Bean` and component scanning) and injected where required.

### Types of injection:

```java
@Service
public class OrderService {

    private final PaymentService paymentService;

    // Constructor injection (recommended)
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}

@Service
public class ReportService {
    @Autowired                 // Field injection (discouraged)
    private OrderService orderService;

    private LogService logService;

    @Autowired                 // Setter injection
    public void setLogService(LogService logService) {
        this.logService = logService;
    }
}
```

### How Spring Boot implements it:

- **Auto-configuration** and `@ComponentScan` (enabled by `@SpringBootApplication`) discover beans automatically.
- The container builds a dependency graph and injects beans, resolving by **type** (and by name/`@Qualifier` when ambiguous).

---

## Question 12: What is the difference between @Component, @Service, @Repository, and @Controller?

### Answer:

All four are **stereotype annotations** that mark a class as a Spring-managed bean (they are all specializations of `@Component`). They differ in semantic intent and some add behavior:

| Annotation | Layer | Special behavior |
|---|---|---|
| `@Component` | Generic | Base stereotype; no extra behavior |
| `@Service` | Business/service layer | Semantic marker only |
| `@Repository` | Persistence/DAO layer | Enables **exception translation** (`PersistenceExceptionTranslationPostProcessor` converts JDBC/JPA exceptions into Spring's `DataAccessException`) |
| `@Controller` | Web/presentation layer | Handles HTTP requests; used with `@RequestMapping`. `@RestController` = `@Controller` + `@ResponseBody` |

```java
@Repository
public class UserRepository { /* DAO logic */ }

@Service
public class UserService { /* business logic */ }

@RestController
public class UserController { /* REST endpoints */ }
```

### Key point:

Functionally `@Service` and `@Component` are almost identical, but using the correct stereotype improves readability, tooling, and lets Spring apply layer-specific behavior (like `@Repository`'s exception translation).

---

## Question 13: Explain the difference between @RequestParam, @PathVariable, and @RequestBody.

### Answer:

- **`@PathVariable`** — extracts a value embedded in the URI path.
- **`@RequestParam`** — extracts a query parameter (or form field), e.g. `?key=value`.
- **`@RequestBody`** — binds the entire HTTP request body (usually JSON) to a Java object via message converters.

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // GET /api/users/42
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) { ... }

    // GET /api/users?status=active&page=2
    @GetMapping
    public List<User> search(@RequestParam String status,
                             @RequestParam(defaultValue = "0") int page) { ... }

    // POST /api/users  with JSON body
    @PostMapping
    public User create(@RequestBody User user) { ... }
}
```

### Key points:

- Use `@PathVariable` to identify a resource (`/users/{id}`).
- Use `@RequestParam` for optional filters, sorting, pagination.
- Use `@RequestBody` to receive complex payloads (create/update). Only one `@RequestBody` per method.

---

## Question 14: What is the difference between @Autowired and constructor injection? Which one is recommended and why?

### Answer:

`@Autowired` can be applied on **fields**, **setters**, or **constructors**. "Constructor injection" means dependencies are provided through the constructor.

```java
// Field injection with @Autowired (discouraged)
@Service
public class A {
    @Autowired
    private B b;
}

// Constructor injection (recommended)
@Service
public class A {
    private final B b;

    public A(B b) {   // @Autowired optional if single constructor
        this.b = b;
    }
}
```

### Constructor injection is recommended because:

- **Immutability:** dependencies can be `final`.
- **Guaranteed dependencies:** the object cannot be created in an invalid, half-initialized state.
- **Easier testing:** dependencies can be passed directly in unit tests without reflection or a Spring context.
- **Detects circular dependencies** at startup instead of at runtime.
- Since Spring 4.3, `@Autowired` is optional when there is a single constructor.

Field injection is discouraged because it hides dependencies, prevents `final`, and requires reflection/a container to test.

---

## Question 15: What are Microservices? What are their advantages and disadvantages?

### Answer:

**Microservices** is an architectural style where an application is built as a suite of small, independently deployable services, each owning a single business capability and communicating over lightweight protocols (HTTP/REST, messaging).

### Advantages:

- **Independent deployment & scaling** — scale only the services that need it.
- **Technology heterogeneity** — each service can use a different language/database.
- **Fault isolation** — a failure in one service need not bring down the whole system.
- **Team autonomy** — small teams own services end to end.
- Faster, more frequent releases.

### Disadvantages:

- **Operational complexity** — many services to deploy, monitor, and secure.
- **Distributed system challenges** — network latency, partial failures, eventual consistency.
- **Data management** — distributed transactions are hard (need Saga, etc.).
- **Testing & debugging** — end-to-end flows span multiple services.
- Requires strong DevOps, CI/CD, observability, and infrastructure investment.

### Key point:

Microservices trade in-process simplicity for scalability and autonomy; they are worthwhile for large, evolving systems but overkill for small applications (where a **monolith** is often better).

---

## Question 16: How does service-to-service communication happen in a Microservices architecture?

### Answer:

There are two broad communication styles:

### 1. Synchronous (request/response):

- **REST over HTTP** — most common; using `RestTemplate`, `WebClient`, or declarative **OpenFeign** clients.
- **gRPC** — high-performance binary RPC using Protobuf.

```java
@FeignClient(name = "payment-service")
public interface PaymentClient {
    @PostMapping("/payments")
    PaymentResponse pay(@RequestBody PaymentRequest request);
}
```

### 2. Asynchronous (event-driven):

- **Message brokers** like **Kafka**, RabbitMQ, or ActiveMQ. Services publish/subscribe to events, achieving loose coupling and resilience.

```java
@KafkaListener(topics = "orders")
public void onOrder(OrderEvent event) { ... }
```

### Supporting infrastructure:

- **Service discovery** (Eureka, Consul) so services find each other without hardcoded hosts.
- **API Gateway** (Spring Cloud Gateway) as a single entry point handling routing, auth, rate limiting.
- **Load balancing** (Spring Cloud LoadBalancer) across service instances.

### Key point:

Prefer **asynchronous messaging** for loose coupling and resilience; use **synchronous** calls when you need an immediate response, guarded by timeouts and circuit breakers.

---

## Question 17: What is the Circuit Breaker pattern? Why is it used?

### Answer:

The **Circuit Breaker** pattern prevents an application from repeatedly calling a remote service that is likely to fail, avoiding cascading failures and resource exhaustion. It works like an electrical circuit breaker.

### States:

- **CLOSED** — calls flow normally; failures are counted.
- **OPEN** — once the failure threshold is exceeded, calls are **blocked immediately** (fail fast) and a fallback is returned, giving the failing service time to recover.
- **HALF-OPEN** — after a wait period, a few trial calls are allowed; if they succeed the breaker closes again, otherwise it reopens.

```java
@Service
public class InventoryService {

    @CircuitBreaker(name = "inventory", fallbackMethod = "fallback")
    public String checkStock(String item) {
        return remoteInventoryClient.check(item); // may fail
    }

    public String fallback(String item, Throwable t) {
        return "Inventory service unavailable, please retry later";
    }
}
```

### Why it is used:

- **Prevents cascading failures** across microservices.
- **Fails fast** instead of blocking threads on slow/dead services.
- Gives struggling services **time to recover**.
- Commonly implemented with **Resilience4j** (or the older Netflix Hystrix), often combined with retries, timeouts, and bulkheads.

---

## Question 18: What are database indexes? What is the difference between clustered and non-clustered indexes?

### Answer:

A **database index** is a data structure (typically a B-tree) that speeds up data retrieval on one or more columns, at the cost of extra storage and slower writes (the index must be maintained on insert/update/delete).

### Clustered index:

- Determines the **physical order** of rows in the table.
- There can be **only one** per table (the data *is* the index leaf level).
- Usually created on the primary key.
- Fast for range queries because rows are physically sorted.

### Non-clustered index:

- A **separate structure** that stores the indexed column(s) plus a pointer (row locator) back to the actual row.
- A table can have **many** non-clustered indexes.
- Requires an extra lookup to fetch non-indexed columns (unless it is a covering index).

```sql
-- Clustered (implicitly created on primary key in many RDBMS)
CREATE TABLE employee (
    id INT PRIMARY KEY,      -- clustered index
    name VARCHAR(100),
    dept_id INT
);

-- Non-clustered index for faster lookups by department
CREATE INDEX idx_dept ON employee(dept_id);
```

### Key point:

- **Clustered** = the table sorted by the key (one per table).
- **Non-clustered** = a lookup structure pointing to rows (many allowed).
- Index columns used in `WHERE`, `JOIN`, and `ORDER BY`, but avoid over-indexing since it slows writes.

---

## Question 19: Write an SQL query to find the second highest salary from an employee table.

### Answer:

Given a table `employee(id, name, salary)`:

### Approach 1 — Using a subquery (MAX):

```sql
SELECT MAX(salary) AS second_highest
FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);
```

### Approach 2 — Using LIMIT / OFFSET (MySQL, PostgreSQL):

```sql
SELECT DISTINCT salary
FROM employee
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
```

### Approach 3 — Using DENSE_RANK (handles ties, standard SQL):

```sql
SELECT salary
FROM (
    SELECT salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employee
) ranked
WHERE rnk = 2;
```

### Key points:

- Approach 1 safely returns `NULL` if there is no second-highest salary.
- Use `DISTINCT` / `DENSE_RANK()` to correctly handle **duplicate salaries** — `DENSE_RANK()` treats equal salaries as the same rank, so "second highest" means the second distinct value.
- `ROW_NUMBER()` would fail with ties; `DENSE_RANK()` is the robust choice.

---

## Question 20: How do you optimize the performance of a Spring Boot application?

### Answer:

Optimization spans several layers:

### Database / persistence:

- Fix the **N+1 query problem** (use `JOIN FETCH`, `@EntityGraph`, or batch fetching).
- Add appropriate **indexes**; page large result sets (`Pageable`).
- Use **connection pooling** (HikariCP — the default in Spring Boot) and tune pool size.
- Enable JPA **batch inserts/updates** (`hibernate.jdbc.batch_size`).

### Caching:

- Use `@Cacheable` with a provider (Redis, Caffeine, EhCache) for expensive, repeated reads.

```java
@Cacheable("products")
public Product getProduct(Long id) { ... }
```

### Application / JVM:

- Use **asynchronous processing** (`@Async`, `CompletableFuture`) and non-blocking I/O (WebFlux) for high concurrency.
- Tune JVM heap and GC; profile with tools like **JProfiler**, **VisualVM**, or **async-profiler**.
- Lazy-initialize beans where startup time matters; trim unused auto-configurations.

### API / web layer:

- Enable **GZIP compression** and HTTP/2.
- Return DTOs (avoid serializing entire entities / lazy proxies).
- Use pagination and filtering to limit payload sizes.

### Observability:

- Add metrics with **Spring Boot Actuator + Micrometer** (Prometheus/Grafana) and distributed tracing to find real bottlenecks before optimizing.

### Key point:

**Measure first** — use profiling and metrics to find the actual bottleneck, then optimize the database, caching, and concurrency accordingly rather than guessing.

---

## Evaluation Tips

- For **Core Java** questions (1–9), check whether the candidate understands *why*, not just definitions — e.g., the `equals`/`hashCode` contract's effect on `HashMap`, or `map` vs `flatMap`.
- For **Spring Boot** questions (10–14), look for awareness of best practices such as constructor injection and correct stereotype usage.
- For **Microservices** questions (15–17), assess understanding of distributed-system trade-offs and resilience patterns.
- For **SQL** questions (18–19), see if they can handle edge cases (ties, no second salary) and explain indexing trade-offs.
- For **performance** (20), a strong candidate emphasizes *measuring before optimizing*.
