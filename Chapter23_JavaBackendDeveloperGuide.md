# Chapter 23: Java Backend Developer Guide — Language, OOP, Concurrency, Streams, Spring & Security

## Overview

A deep-dive Java Backend Developer guide covering modern language features, interfaces & OOP/SOLID, concurrency, streams, the Spring Framework & Spring Boot internals, and Spring Security & JWT. Organized into sections with detailed answers and code examples.

- **Section A — Core Java & Language Features** (Q1–9)
- **Section B — Interfaces & OOP** (Q10–15)
- **Section C — Concurrency & Multithreading** (Q16–19)
- **Section D — Streams & Functional Programming** (Q20–21)
- **Section E — Spring Framework & Spring Boot** (Q22–31)
- **Section F — Spring Security & JWT** (Q32–34)

---

# Section A — Core Java & Language Features

## Q1: What are the key features introduced in Java 17?

### Answer:

Java 17 is an **LTS** release. Key features (many finalized from earlier previews):

- **Sealed classes/interfaces** (`sealed ... permits`): restrict which types can extend/implement.
- **Pattern matching for `instanceof`**: `if (o instanceof String s) { ... }` — no explicit cast.
- **Records** (finalized in 16): concise immutable data carriers.
- **Switch expressions** (finalized in 14): arrow syntax, returns a value.
- **Text blocks** (finalized in 15): multi-line string literals `"""..."""`.
- **Enhanced pseudo-random number generators** (`RandomGenerator` API).
- **New macOS rendering pipeline**, **strong encapsulation of JDK internals**, removal of the deprecated Applet API/Security Manager deprecation.

```java
sealed interface Shape permits Circle, Square {}
record Circle(double r) implements Shape {}

double area = switch (shape) {
    case Circle c -> Math.PI * c.r() * c.r();
    case Square s -> s.side() * s.side();
};
```

### Key point:

Java 17 (LTS) finalized sealed classes, pattern matching for `instanceof`, records, switch expressions, and text blocks, plus stronger encapsulation of internals.

---

## Q2: What is the `var` keyword? Can it be used as a generic type?

### Answer:

`var` (Java 10+) enables **local variable type inference** — the compiler infers the static type from the initializer. It is **not** dynamic typing; the type is fixed at compile time.

```java
var list = new ArrayList<String>();  // inferred ArrayList<String>
var count = 10;                       // int
```

**Restrictions:** only for **local variables with an initializer** (and for-loop variables). It **cannot** be used for fields, method parameters, return types, or without an initializer.

Regarding generics: you cannot use `var` **as** a generic type parameter (e.g. `List<var>` is illegal), but you can declare a variable of a generic type with `var` (the generic type is inferred: `var map = new HashMap<String,Integer>()`).

### Key point:

`var` infers a local variable's type at compile time (still statically typed). It can hold a generic type but cannot be used as a type argument or for fields/params/returns.

---

## Q3: What is an effectively final variable in Java?

### Answer:

A variable is **effectively final** if it is never reassigned after initialization, even though it is not explicitly declared `final`. Java 8+ allows lambdas and anonymous/local classes to **capture** such variables.

```java
int base = 10;               // effectively final (never reassigned)
Runnable r = () -> System.out.println(base);  // OK

int x = 1;
x = 2;                        // reassigned -> NOT effectively final
// Runnable bad = () -> System.out.println(x); // compile error
```

### Key point:

An effectively final variable is one that's never reassigned, so the compiler treats it as `final` — enabling it to be captured by lambdas/inner classes.

---

## Q4: What is the Record class, and how can data be stored in a Record when a query returns a list? How do you retrieve the first record?

### Answer:

A **record** (Java 16+) is an immutable data carrier. Declaring `record Employee(int id, String name)` auto-generates a private final field per component, a canonical constructor, accessors (`id()`, `name()`), and `equals()`/`hashCode()`/`toString()`.

**Storing query results in records** — map each row/entity to a record, collect into a `List`:

```java
record Employee(int id, String name, double salary) {}

List<Employee> employees = rows.stream()
        .map(r -> new Employee(r.getInt("id"), r.getString("name"), r.getDouble("salary")))
        .collect(Collectors.toList());
// (with Spring Data JPA you can also use interface/record DTO projections directly)
```

**Retrieve the first record** safely:

```java
Optional<Employee> first = employees.stream().findFirst();
Employee firstOrNull = employees.isEmpty() ? null : employees.get(0);
```

### Key point:

A record is a concise immutable data class; map query rows to records and collect into a `List`, then get the first with `list.get(0)` (guard for empty) or `stream().findFirst()` returning an `Optional`.

---

## Q5: What is the Optional class?

### Answer:

`Optional<T>` (Java 8) is a container that may or may not hold a non-null value, designed to represent "absence" explicitly and **avoid `NullPointerException`** and null checks.

```java
Optional<User> user = repo.findById(id);

String name = user.map(User::getName).orElse("Unknown");
user.ifPresent(u -> log.info(u.getName()));
User u = user.orElseThrow(() -> new NotFoundException(id));
```

Common methods: `of`, `ofNullable`, `empty`, `isPresent`/`isEmpty`, `get`, `orElse`, `orElseGet`, `orElseThrow`, `map`, `flatMap`, `filter`, `ifPresent`.

**Best practices:** use as a **return type** for "maybe absent" results; don't use for fields, method parameters, or collections; avoid calling `get()` without checking.

### Key point:

`Optional` explicitly models a possibly-absent value to prevent NPEs; use it as a return type with `map`/`orElse`/`orElseThrow`, not for fields or parameters.

---

## Q6: What are checked exceptions? Discuss their advantages and disadvantages.

### Answer:

**Checked exceptions** extend `Exception` (but not `RuntimeException`) and must be either caught or declared in the method's `throws` clause — enforced at compile time (e.g. `IOException`, `SQLException`). **Unchecked** (`RuntimeException`) are not enforced.

**Advantages:**

- Force the caller to **acknowledge and handle** recoverable failures.
- Make the failure modes part of the API contract (self-documenting).

**Disadvantages:**

- **Boilerplate:** try/catch or `throws` propagation clutters code.
- **Poor fit with lambdas/streams** (functional interfaces don't declare checked exceptions).
- Often leads to swallowing exceptions or wrapping in `RuntimeException` anyway.
- Tight coupling: adding a checked exception ripples through call sites.

Many modern frameworks (Spring) favor **unchecked** exceptions.

### Key point:

Checked exceptions are compiler-enforced for recoverable errors — good for explicit contracts, but they add boilerplate and clash with streams/lambdas, which is why modern code often prefers unchecked exceptions.

---

## Q7: What is exception handling, and what is the purpose of Controller Advisor?

### Answer:

**Exception handling** is the mechanism (`try`/`catch`/`finally`, `throw`, `throws`) to gracefully manage runtime errors and keep the application stable, separating error-handling from business logic.

**`@ControllerAdvice` / `@RestControllerAdvice`** provides **global, centralized exception handling** across all controllers in Spring. Instead of try/catch in every controller, you define `@ExceptionHandler` methods once, mapping exceptions to consistent HTTP responses.

```java
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    ProblemDetail handleNotFound(EntityNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```

### Key point:

Exception handling manages runtime errors gracefully; `@ControllerAdvice`/`@RestControllerAdvice` centralizes it, mapping exceptions to consistent HTTP responses across all controllers.

---

## Q8: Reverse a string without using any predefined methods.

### Answer:

Reverse manually with a `char` array and a loop (no `StringBuilder.reverse()`, no library helpers):

```java
public static String reverse(String input) {
    char[] chars = input.toCharArray();
    int left = 0, right = chars.length - 1;
    while (left < right) {
        char temp = chars[left];
        chars[left] = chars[right];
        chars[right] = temp;
        left++;
        right--;
    }
    return new String(chars);
}
// reverse("hello") -> "olleh"
```

Alternative — build by iterating from the end:

```java
public static String reverse(String s) {
    char[] result = new char[s.length()];
    for (int i = 0; i < s.length(); i++) {
        result[i] = s.charAt(s.length() - 1 - i);
    }
    return new String(result);
}
```

### Key point:

Convert to a char array and swap from both ends toward the middle (two-pointer), `O(n)` time and `O(n)` space — no built-in reverse used.

---

## Q9: Can HashMap keys be mutable? Why or why not?

### Answer:

Technically you *can* use a mutable object as a key, but you **should not**. A `HashMap` places an entry in a bucket based on the key's `hashCode()` **at insertion time**. If the key is later **mutated** so its `hashCode()`/`equals()` changes, the entry is now in the "wrong" bucket — you can no longer retrieve it (a `get` computes the new hash and looks in a different bucket), effectively **losing** the value and leaking memory.

That's why **immutable keys** (like `String`, `Integer`) are strongly recommended — their hash never changes.

```java
// Anti-pattern:
Map<List<Integer>, String> map = new HashMap<>();
List<Integer> key = new ArrayList<>(List.of(1, 2));
map.put(key, "value");
key.add(3);                 // mutated -> hashCode changed
map.get(key);               // likely returns null!
```

### Key point:

Avoid mutable keys: the bucket is fixed by the key's hash at insertion, so mutating it changes the hash and makes the entry unreachable. Use immutable keys like `String`/`Integer`.

---

# Section B — Interfaces & OOP

## Q10: Is it possible to define private methods in an interface?

### Answer:

Yes — since **Java 9**, interfaces can have **private** methods (and private static methods). They exist to share common code between `default`/`static` methods **without exposing it** to implementing classes.

```java
interface Service {
    default void start() { log("starting"); }
    default void stop()  { log("stopping"); }

    private void log(String msg) {           // private helper, not part of the API
        System.out.println("[Service] " + msg);
    }
}
```

### Key point:

Yes, since Java 9 — private (and private static) interface methods let default/static methods reuse code internally without exposing it to implementers.

---

## Q11: What types of methods can be declared in an interface?

### Answer:

- **Abstract methods:** implicitly `public abstract`; no body (the classic interface method).
- **Default methods** (Java 8+): `default` keyword, with a body; inherited by implementers, overridable — added to evolve interfaces without breaking existing code.
- **Static methods** (Java 8+): belong to the interface, called as `Interface.method()`.
- **Private methods** (Java 9+): helpers for default/static methods.
- **Private static methods** (Java 9+): static helpers.

Fields in interfaces are implicitly `public static final` (constants).

### Key point:

Abstract (default), plus (Java 8+) default and static methods with bodies, and (Java 9+) private and private static helper methods.

---

## Q12: What happens when two interfaces contain identical default methods and a class implements both? How can this conflict be resolved?

### Answer:

This is the **diamond problem** for default methods. If a class implements two interfaces with the **same default method signature**, the compiler forces the class to **override** it (otherwise a compile error), removing the ambiguity. The override can explicitly call a chosen interface's version using `InterfaceName.super.method()`.

```java
interface A { default String hello() { return "A"; } }
interface B { default String hello() { return "B"; } }

class C implements A, B {
    @Override
    public String hello() {
        return A.super.hello();   // explicitly pick A's (or B's, or custom)
    }
}
```

### Key point:

The compiler requires the implementing class to override the conflicting default method; it can delegate to a specific parent via `A.super.method()`.

---

## Q13: Explain the SOLID design principles.

### Answer:

- **S — Single Responsibility:** a class should have one reason to change (one responsibility).
- **O — Open/Closed:** open for extension, closed for modification — add behavior via new code (polymorphism/strategy), not by editing existing classes.
- **L — Liskov Substitution:** subtypes must be usable anywhere their base type is expected without breaking correctness.
- **I — Interface Segregation:** prefer many small, specific interfaces over one large "fat" interface, so clients depend only on what they use.
- **D — Dependency Inversion:** depend on **abstractions**, not concrete implementations; high-level modules shouldn't depend on low-level details (enables DI).

### Key point:

SOLID = Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion — principles for loosely-coupled, maintainable, extensible OOP.

---

## Q14: What is the Liskov Substitution Principle? If a subclass can replace its parent, why is inheritance still required?

### Answer:

**LSP:** objects of a subclass must be substitutable for their superclass **without altering the correctness** of the program. A subclass must honor the base type's contract (not strengthen preconditions, weaken postconditions, or throw unexpected exceptions). The classic violation: `Square extends Rectangle` breaking `setWidth`/`setHeight` expectations.

**Why inheritance is still needed:** LSP isn't about *removing* inheritance — it's a rule that makes inheritance **safe**. Inheritance provides **code reuse, a shared type/contract, and polymorphism** (treating many subtypes uniformly). LSP ensures those substitutions behave correctly. (When an "is-a" relationship doesn't truly hold, prefer **composition** over inheritance.)

### Key point:

LSP requires subtypes to be safely substitutable for their base type while preserving correctness. Inheritance is still valuable for reuse, shared contracts, and polymorphism — LSP just keeps it correct; use composition when true "is-a" doesn't hold.

---

## Q15: Explain and implement the Factory Design Pattern (with a slight modification).

### Answer:

The **Factory pattern** encapsulates object creation behind a method, so callers request an object by type/parameter without using `new` on concrete classes — decoupling creation from use (supports Open/Closed & Dependency Inversion).

**Classic + modification** (registry-based factory so adding a new type doesn't require editing a `switch`):

```java
interface Notification { void send(String msg); }
class EmailNotification implements Notification {
    public void send(String msg) { System.out.println("Email: " + msg); }
}
class SmsNotification implements Notification {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}

// Modified factory: a registry of suppliers (extensible without editing a switch)
class NotificationFactory {
    private static final Map<String, Supplier<Notification>> REGISTRY = new HashMap<>();
    static {
        REGISTRY.put("EMAIL", EmailNotification::new);
        REGISTRY.put("SMS", SmsNotification::new);
    }
    public static void register(String type, Supplier<Notification> supplier) {
        REGISTRY.put(type.toUpperCase(), supplier);
    }
    public static Notification create(String type) {
        Supplier<Notification> s = REGISTRY.get(type.toUpperCase());
        if (s == null) throw new IllegalArgumentException("Unknown type: " + type);
        return s.get();
    }
}

// Usage
Notification n = NotificationFactory.create("EMAIL");
n.send("Hello");
NotificationFactory.register("PUSH", PushNotification::new); // extend without modifying factory
```

### Key point:

Factory centralizes object creation behind an interface; the modification uses a **registry of suppliers** so new types are added via `register(...)` instead of editing a `switch`, satisfying the Open/Closed principle.

---

# Section C — Concurrency & Multithreading

## Q16: What is the difference between the `synchronized` keyword and `ReentrantLock`? What are the trade-offs?

### Answer:

| Aspect | `synchronized` | `ReentrantLock` |
|---|---|---|
| Acquire/release | Implicit (auto-released) | Explicit `lock()`/`unlock()` (in `finally`) |
| Try / timeout | No | `tryLock()`, `tryLock(timeout)` |
| Interruptible | No | `lockInterruptibly()` |
| Fairness | No | Optional fair mode |
| Conditions | Single wait-set (`wait`/`notify`) | Multiple `Condition` objects |
| Simplicity | Simpler, less error-prone | More flexible, more boilerplate |

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { /* critical section */ }
finally { lock.unlock(); }   // must always unlock
```

**Trade-offs:** `synchronized` is simpler and auto-released (no leak risk). `ReentrantLock` offers tryLock/timeouts, interruptibility, fairness, and multiple conditions — at the cost of manual unlocking (forgetting `unlock()` deadlocks) and more code.

### Key point:

`synchronized` = simple, implicit locking; `ReentrantLock` = advanced features (tryLock/timeout, interruptible, fairness, multiple conditions) but you must unlock manually in `finally`.

---

## Q17: What is the `volatile` keyword?

### Answer:

`volatile` marks a variable so that:

- **Visibility:** every read/write goes to **main memory**, not a thread-local cache — so a write by one thread is immediately visible to others.
- **Ordering:** prevents certain instruction reordering (establishes a happens-before relationship) around the variable.

It does **not** provide atomicity for compound operations like `count++` (read-modify-write). Use it for simple flags/state shared between threads.

```java
private volatile boolean running = true;   // visible to all threads
public void stop() { running = false; }
```

### Key point:

`volatile` guarantees cross-thread visibility and ordering for a single variable, but not atomicity for compound operations.

---

## Q18: What is the difference between the `volatile` keyword and Atomic classes (`AtomicInteger` & `AtomicFloat`)?

### Answer:

- **`volatile`:** guarantees **visibility/ordering** only. Compound updates (`x++`) are **not atomic** — two threads can lose updates.
- **Atomic classes** (`AtomicInteger`, `AtomicLong`, `AtomicReference`, ...): provide **atomic, lock-free** read-modify-write operations using **CAS** (compare-and-swap), e.g. `incrementAndGet()`, `compareAndSet()`. They include volatile visibility **and** atomicity.

```java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();   // atomic; safe from multiple threads

volatile int c;
c++;                         // NOT atomic -> race condition
```

Note: there is no `AtomicFloat`; use `AtomicInteger`/`AtomicLong` with `Float.floatToIntBits`, or `AtomicReference<Float>`/`DoubleAdder` for floating point.

### Key point:

`volatile` = visibility only (no atomic compound ops); Atomic classes add **atomicity** via lock-free CAS, so counters/flags update safely without locks.

---

## Q19: Explain the commonly used methods of `CompletableFuture`.

### Answer:

`CompletableFuture` (Java 8) supports asynchronous, non-blocking composition of tasks:

- **Start async:** `supplyAsync(Supplier)` (returns a value), `runAsync(Runnable)` (no value).
- **Transform:** `thenApply(fn)` (sync transform), `thenApplyAsync(fn)`.
- **Chain another future:** `thenCompose(fn)` (flatten dependent futures — avoids nesting).
- **Consume:** `thenAccept(consumer)`, `thenRun(runnable)`.
- **Combine two:** `thenCombine(other, biFn)`.
- **Wait for many:** `allOf(...)`, `anyOf(...)`.
- **Error handling:** `exceptionally(fn)`, `handle(biFn)`, `whenComplete(biConsumer)`.
- **Get result:** `join()` / `get()` (blocking).

```java
CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(User::getName)
    .thenCombine(CompletableFuture.supplyAsync(() -> fetchScore(id)),
                 (name, score) -> name + ": " + score)
    .exceptionally(ex -> "error: " + ex.getMessage())
    .thenAccept(System.out::println);
```

### Key point:

`supplyAsync`/`runAsync` start async work; `thenApply`/`thenCompose`/`thenCombine` transform and compose; `allOf`/`anyOf` coordinate many; `exceptionally`/`handle` manage errors; `join`/`get` block for the result.

---

# Section D — Streams & Functional Programming

## Q20: What is the difference between Stream & Parallel Stream? Have you used Parallel Stream in a production project?

### Answer:

- **Stream (sequential):** processes elements one at a time on the calling thread.
- **Parallel Stream:** splits the source and processes chunks concurrently across the **common ForkJoinPool** (`stream.parallel()` / `collection.parallelStream()`), then combines results.

```java
long count = list.parallelStream().filter(x -> x > 100).count();
```

**When parallel helps:** large datasets, CPU-bound, independent operations, and a splittable source (arrays/`ArrayList`). **When it hurts:** small datasets (overhead), I/O-bound tasks, ordered/stateful operations, or shared mutable state (thread-safety bugs). It also shares the common pool, which can starve other tasks.

**Production experience (honest framing):** parallel streams are used sparingly — mainly for large in-memory CPU-bound computations (e.g. bulk transformations/aggregations) after measuring a benefit. For I/O-bound work, a dedicated `ExecutorService`/`CompletableFuture` is preferred over parallel streams; and blocking calls inside a parallel stream on the common pool are avoided.

### Key point:

Parallel streams fan work across the common ForkJoinPool — beneficial for large CPU-bound, independent, splittable workloads, but harmful for small/I-O-bound/stateful cases. Use them deliberately after measuring, not by default.

---

## Q21: Stream vs flatMap.

### Answer:

`flatMap` is a stream operation, so the real question is **`map` vs `flatMap`**:

- **`map`:** one-to-one transform — each element becomes exactly one element. If each element maps to a collection/stream, you get a **nested** stream (`Stream<Stream<X>>`).
- **`flatMap`:** one-to-many — maps each element to a **stream** and **flattens** all of them into a single stream.

```java
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));

// map -> Stream<List<Integer>> (nested)
nested.stream().map(l -> l);

// flatMap -> Stream<Integer> (flattened)
List<Integer> flat = nested.stream()
        .flatMap(List::stream)
        .collect(Collectors.toList());   // [1, 2, 3, 4]
```

Use `flatMap` to flatten nested structures (lists of lists, splitting strings into words, `Optional` chaining).

### Key point:

`map` transforms one-to-one (can leave nested streams); `flatMap` transforms one-to-many and flattens into a single stream — use it to un-nest collections.

---

# Section E — Spring Framework & Spring Boot

## Q22: Explain the internal working of the Spring Container.

### Answer:

The **Spring container** (`ApplicationContext`/`BeanFactory`) manages the lifecycle and configuration of beans:

1. **Load configuration** (annotations/Java config/XML) and create **BeanDefinitions** (metadata about each bean).
2. **BeanFactoryPostProcessors** run (e.g. property placeholder resolution).
3. **Instantiate** beans (usually singletons, eagerly).
4. **Populate dependencies** (DI by type/qualifier), resolving the dependency graph.
5. Run **Aware** callbacks and **BeanPostProcessors** (before/after init) — where `@Autowired` is processed and **AOP proxies** are created.
6. Run **initialization** callbacks (`@PostConstruct`, `afterPropertiesSet`).
7. Beans are ready and cached; on shutdown, **destruction** callbacks run.

### Key point:

The container reads bean definitions, instantiates beans, injects dependencies, applies post-processors (AOP proxies, `@Autowired`), runs init/destroy callbacks, and manages their scope/lifecycle — inverting control of object creation.

---

## Q23: Describe the Bean Lifecycle.

### Answer:

1. **Instantiation** — container creates the bean.
2. **Populate properties / dependency injection.**
3. **Aware interfaces** (`BeanNameAware`, `ApplicationContextAware`, ...).
4. **`BeanPostProcessor.postProcessBeforeInitialization`.**
5. **Initialization:** `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `init-method`.
6. **`BeanPostProcessor.postProcessAfterInitialization`** (AOP proxies created here).
7. **Bean in use.**
8. **Destruction** (on shutdown): `@PreDestroy` → `DisposableBean.destroy()` → custom `destroy-method`.

```java
@Component
class MyBean {
    @PostConstruct void init() { }
    @PreDestroy   void cleanup() { }
}
```

### Key point:

Instantiate → inject dependencies → Aware callbacks → BeanPostProcessor(before) → init (`@PostConstruct`/`afterPropertiesSet`) → BeanPostProcessor(after) → in use → destroy (`@PreDestroy`). Prototype beans aren't destroyed by the container.

---

## Q24: What is `@EnableAutoConfiguration`?

### Answer:

`@EnableAutoConfiguration` tells Spring Boot to **automatically configure** the application based on the **classpath dependencies, existing beans, and properties**. E.g., if `spring-web` + Tomcat are on the classpath, it auto-configures an embedded web server and Spring MVC; if a DataSource dependency is present, it configures one.

It works by loading auto-configuration classes (listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`) that are guarded by **`@Conditional`** annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, etc.), so they only apply when appropriate and back off when you define your own beans.

It's included in **`@SpringBootApplication`** (= `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`).

### Key point:

It auto-configures beans based on the classpath/properties via conditional auto-configuration classes, backing off when you define your own — and is part of `@SpringBootApplication`.

---

## Q25: What is `@Qualifier`, and how does it differ from `@Primary`?

### Answer:

Both disambiguate when multiple beans of the same type exist:

- **`@Primary`:** marks **one** bean as the **default** choice when no qualifier is given. Defined on the bean.
- **`@Qualifier("name")`:** specifies **exactly which** bean to inject **at the injection point** — takes **precedence** over `@Primary`.

```java
@Bean @Primary DataSource primaryDs() { ... }
@Bean @Qualifier("reporting") DataSource reportingDs() { ... }

@Autowired
public Service(@Qualifier("reporting") DataSource ds) { ... } // gets reportingDs, overriding @Primary
```

### Key point:

`@Primary` sets a default winner among candidates; `@Qualifier` explicitly names the bean at the injection site and overrides `@Primary`.

---

## Q26: What is the difference between IoC and Dependency Injection?

### Answer:

- **IoC (Inversion of Control)** is the broad **principle**: control of object creation and flow is inverted from your code to a container/framework. DI is one way to achieve IoC (others include the service locator pattern, factories, callbacks/template method).
- **Dependency Injection** is a **specific pattern/implementation** of IoC where the container **supplies** an object's dependencies (via constructor/setter/field) rather than the object creating them.

### Key point:

IoC is the general principle of handing control to a framework; DI is a concrete pattern that implements IoC by injecting dependencies into objects.

---

## Q27: What is Dependency Injection, and what are its types?

### Answer:

**DI** is supplying an object's dependencies from outside (the container) instead of the object instantiating them, promoting loose coupling and testability.

**Types:**

1. **Constructor injection** (recommended): dependencies via the constructor; supports `final`, guaranteed/immutable dependencies, easy testing.
2. **Setter injection:** via setter methods; good for optional/changeable dependencies.
3. **Field injection:** directly on fields with `@Autowired`; concise but discouraged (hard to test, can't be `final`, hides dependencies).

```java
@Service
class OrderService {
    private final PaymentService payment;
    OrderService(PaymentService payment) { this.payment = payment; } // constructor injection
}
```

### Key point:

DI supplies dependencies externally; the three types are constructor (preferred), setter (optional deps), and field (discouraged) injection.

---

## Q28: What are Spring Profiles, & how have you used them?

### Answer:

**Spring Profiles** let you register beans/configuration conditionally per **environment** (dev, test, staging, prod). Activate with `spring.profiles.active` (property, env var, or JVM arg).

```java
@Configuration
@Profile("dev")
class DevConfig { @Bean DataSource h2() { ... } }   // only in dev

@Profile("prod")
class ProdConfig { @Bean DataSource postgres() { ... } }
```

Property files per profile: `application-dev.yml`, `application-prod.yml`, plus a base `application.yml`.

**Typical usage:** an in-memory H2 + verbose logging + mock integrations in **dev/test**, and real databases, connection pools, and external endpoints in **prod** — swapping config without code changes.

### Key point:

Profiles conditionally activate beans/properties per environment (`@Profile`, `application-{profile}.yml`, `spring.profiles.active`) so the same build runs with dev vs prod configuration.

---

## Q29: What is the difference between Path Variables and Request Parameters?

### Answer:

- **`@PathVariable`:** binds a value **embedded in the URI path** — used to identify a resource. `GET /users/42` → id 42.
- **`@RequestParam`:** binds a **query string parameter** (or form field) — used for filters, sorting, pagination, optional inputs. `GET /users?status=active&page=2`.

```java
@GetMapping("/users/{id}")
User byId(@PathVariable Long id) { ... }

@GetMapping("/users")
List<User> search(@RequestParam String status,
                  @RequestParam(defaultValue = "0") int page) { ... }
```

### Key point:

`@PathVariable` = part of the URI path (resource identity); `@RequestParam` = query/form parameter (filters, optional inputs, pagination).

---

## Q30: How does the `@Transactional` annotation work?

### Answer:

Spring wraps the bean in an **AOP proxy**. When a `@Transactional` method is called from outside, a `TransactionInterceptor`:

1. **Begins/joins** a transaction via `PlatformTransactionManager` (opens a connection, disables autocommit) per the **propagation** setting (`REQUIRED`, `REQUIRES_NEW`, ...).
2. Binds the connection/`EntityManager` to the thread.
3. Invokes the method.
4. **Commits** on success; **rolls back** on a **runtime (unchecked)** exception (checked exceptions don't roll back unless `rollbackFor` is specified).

Because it's proxy-based, it only applies to **external calls to public methods** — **private methods and same-class self-invocation bypass it** (silent no-op).

### Key point:

A proxy interceptor begins a transaction, commits on success, and rolls back on unchecked exceptions per propagation/isolation — and only works on external calls to public methods (self-invocation/private methods are skipped).

---

## Q31: Explain Fetch Types (Lazy Loading vs Eager Loading).

### Answer:

In JPA/Hibernate, **fetch type** controls when an entity's associations are loaded:

- **EAGER** (`FetchType.EAGER`): the association is loaded **immediately** with the parent (via join or extra query). Default for `@ManyToOne`/`@OneToOne`. Risk: loading too much data / performance hit.
- **LAZY** (`FetchType.LAZY`): the association is loaded **on first access** (a proxy is used until then). Default for `@OneToMany`/`@ManyToMany`. Risk: `LazyInitializationException` if accessed after the session closes, and **N+1** if iterating without fetch join.

```java
@ManyToOne(fetch = FetchType.LAZY)
private Department department;
```

**Best practice:** prefer **LAZY** and explicitly fetch what you need with `JOIN FETCH`/`@EntityGraph` to avoid over-fetching and N+1.

### Key point:

EAGER loads associations upfront (risk: over-fetching); LAZY loads on demand (risk: `LazyInitializationException`/N+1). Prefer LAZY + explicit `JOIN FETCH`/`@EntityGraph` where needed.

---

# Section F — Spring Security & JWT

## Q32: Explain the fundamentals of Spring Security.

### Answer:

Spring Security is a framework for **authentication** (who you are) and **authorization** (what you can do), built on a **filter chain**.

- **`SecurityFilterChain`:** a chain of servlet filters intercepts every request before it reaches controllers.
- **Authentication:** an `AuthenticationManager`/`AuthenticationProvider` validates credentials (e.g. via `UserDetailsService` + `PasswordEncoder`) and stores an `Authentication` in the **`SecurityContext`**.
- **Authorization:** access rules (URL-based via `authorizeHttpRequests`, or method-level `@PreAuthorize`) check roles/authorities.
- Built-in protections: **CSRF**, session management, CORS, password hashing (BCrypt), security headers.

```java
@Bean
SecurityFilterChain chain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(a -> a
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated())
        .httpBasic(Customizer.withDefaults());
    return http.build();
}
```

### Key point:

Spring Security secures apps via a filter chain that performs authentication (credentials → `SecurityContext`) and authorization (URL/method rules), with built-in CSRF/session/password protections.

---

## Q33: How have you implemented Spring Security in your projects?

### Answer:

A typical **JWT-based stateless** implementation:

1. Add `spring-boot-starter-security`; define a `SecurityFilterChain`.
2. **Authentication endpoint** (`/login`): validate credentials via `AuthenticationManager` + `UserDetailsService` (loading users from DB) + `BCryptPasswordEncoder`.
3. On success, **issue a signed JWT** (with subject, roles, expiry).
4. A custom **`OncePerRequestFilter`** extracts the `Authorization: Bearer <token>` header on each request, validates the JWT signature/expiry, and sets the `Authentication` in the `SecurityContext`.
5. Make the API **stateless** (`SessionCreationPolicy.STATELESS`), disable CSRF for token APIs.
6. **Authorization** via roles/authorities (`@PreAuthorize("hasRole('ADMIN')")` or URL rules).

```java
http.csrf(csrf -> csrf.disable())
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(a -> a.requestMatchers("/auth/**").permitAll()
                                 .anyRequest().authenticated())
    .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

### Key point:

Stateless JWT: authenticate at `/login` (UserDetailsService + BCrypt), issue a signed JWT, validate it in a per-request filter that populates the `SecurityContext`, with `STATELESS` sessions and role-based authorization.

---

## Q34: How did you secure distributed microservices using Spring Security?

### Answer:

- **Centralized authentication / API Gateway:** clients authenticate once (or via an identity provider); the **gateway** validates tokens and routes requests, applying auth and rate limiting at the edge.
- **Token-based propagation (OAuth2/OIDC + JWT):** a central **Authorization Server** (Keycloak/Okta/Spring Authorization Server) issues JWTs; each service acts as a **resource server** that validates the JWT (signature via JWKS, issuer, expiry, scopes) — **stateless**, no shared session.
- **Service-to-service:** **client-credentials** flow for machine tokens, and **mTLS** (often via a service mesh) to encrypt and mutually authenticate internal traffic.
- **Zero-trust:** each service independently validates identity and enforces authorization (`@PreAuthorize` on scopes/roles); network policies restrict traffic.
- **Secrets** in Vault/cloud secret managers; keys rotated.

### Key point:

Use an OAuth2/OIDC Authorization Server issuing JWTs, validated statelessly by each resource service (JWKS), with an API gateway for edge auth, client-credentials + mTLS for service-to-service, and zero-trust per-service authorization.

---

## Evaluation Tips

- For language features, check awareness of what's finalized in Java 17 and correct use of records/`Optional`/`var` (and their restrictions).
- For OOP, look for correct SOLID explanations and a nuanced LSP answer (why inheritance still matters); the factory "modification" should show an extensible registry, not a `switch`.
- For concurrency, confirm they distinguish visibility (`volatile`) from atomicity (Atomic/CAS) and can compose `CompletableFuture`s.
- For Spring, check understanding of proxy-based AOP (`@Transactional` self-invocation), container/bean lifecycle, auto-configuration conditionals, and DI vs IoC.
- For security, strong candidates describe **stateless JWT** flows and how to extend them to microservices (OAuth2/OIDC resource servers, gateway, mTLS, zero-trust).
