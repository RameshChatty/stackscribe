# Chapter 4: Java 8-25 Features

## Overview

Modern Java features have transformed development. Senior developers must be proficient with Java 8 (Streams, Lambda) through Java 25 features (Virtual Threads, Pattern Matching).

---

## Question 1: Explain Lambda Expressions and Functional Interfaces

### Answer:

A lambda is an anonymous function that provides a clear way to implement functional interfaces.

**Syntax:**

```java
// Traditional way
Comparator<String> comp1 = new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.compareTo(b);
    }
};

// Lambda expression
Comparator<String> comp2 = (a, b) -> a.compareTo(b);
```

**Functional Interfaces - Single Abstract Method (SAM):**

```java
// Built-in functional interfaces
@FunctionalInterface
interface Predicate<T> {
    boolean test(T t);
}

@FunctionalInterface
interface Function<T, R> {
    R apply(T t);
}

@FunctionalInterface
interface Consumer<T> {
    void accept(T t);
}

@FunctionalInterface
interface Supplier<T> {
    T get();
}

// Custom functional interface
@FunctionalInterface
public interface Calculator {
    int calculate(int a, int b);
}

// Usage
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;

System.out.println(add.calculate(5, 3));      // 8
System.out.println(multiply.calculate(5, 3));  // 15
```

**Lambda Expression Rules:**

```java
// 1. Single parameter - parentheses optional
Function<String, Integer> length1 = str -> str.length();
Function<String, Integer> length2 = (str) -> str.length();

// 2. Multiple parameters - parentheses required
BiFunction<Integer, Integer, Integer> sum = (a, b) -> a + b;

// 3. Single line - return implicit
Predicate<String> isEmpty = str -> str.isEmpty();

// 4. Multiple lines - braces required
Predicate<String> isValidEmail = email -> {
    String pattern = "^[A-Za-z0-9+_.-]+@(.+)$";
    return email.matches(pattern);
};

// 5. Empty parameter list
Supplier<String> getDefault = () -> "DEFAULT";

// 6. Type inference
Function<Integer, String> toHex = x -> Integer.toHexString(x);
```

**Method References (Shorthand for lambdas):**

```java
// Instead of: x -> Integer.toHexString(x)
Function<Integer, String> toHex = Integer::toHexString;

// Static method reference
Function<String, Integer> parseInt = Integer::parseInt;

// Instance method reference
String str = "hello";
Supplier<Integer> length = str::length;

// Constructor reference
Supplier<List<String>> listSupplier = ArrayList::new;
Function<Integer, Integer[]> arrayCreator = Integer[]::new;

// Object method reference
List<String> strings = Arrays.asList("a", "b", "c");
Consumer<String> print = System.out::println;
strings.forEach(print);
```

---

## Question 2: Streams API - Map, Filter, Reduce, Collect

### Answer:

Streams provide functional-style operations on collections.

**Stream Pipeline:**

```
Source → Intermediate Operations → Terminal Operation
         (lazy evaluation)          (triggers evaluation)
```

**Common Intermediate Operations:**

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6);

// filter - keep elements matching predicate
numbers.stream()
    .filter(n -> n % 2 == 0)
    .forEach(System.out::println);  // 2, 4, 6

// map - transform each element
numbers.stream()
    .map(n -> n * n)
    .forEach(System.out::println);  // 1, 4, 9, 16, 25, 36

// flatMap - map then flatten
List<List<Integer>> lists = Arrays.asList(
    Arrays.asList(1, 2),
    Arrays.asList(3, 4)
);
lists.stream()
    .flatMap(Collection::stream)
    .forEach(System.out::println);  // 1, 2, 3, 4

// distinct - remove duplicates
numbers.stream()
    .distinct()
    .forEach(System.out::println);

// sorted - sort elements
numbers.stream()
    .sorted(Comparator.reverseOrder())
    .forEach(System.out::println);  // 6, 5, 4, 3, 2, 1

// limit - limit output size
numbers.stream()
    .limit(3)
    .forEach(System.out::println);  // 1, 2, 3

// skip - skip first n elements
numbers.stream()
    .skip(2)
    .forEach(System.out::println);  // 3, 4, 5, 6

// peek - intermediate debugging
numbers.stream()
    .peek(n -> System.out.println("Processing: " + n))
    .filter(n -> n > 3)
    .forEach(n -> System.out.println("Result: " + n));
```

**Terminal Operations:**

```java
// forEach - perform action on each element
numbers.stream()
    .forEach(System.out::println);

// collect - accumulate into collection
List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

// reduce - combine elements
Optional<Integer> sum = numbers.stream()
    .reduce((a, b) -> a + b);
System.out.println(sum.get());  // 21

int product = numbers.stream()
    .reduce(1, (a, b) -> a * b);  // 720

// count
long count = numbers.stream()
    .filter(n -> n > 3)
    .count();  // 3

// findFirst - get first element
Optional<Integer> first = numbers.stream()
    .filter(n -> n > 3)
    .findFirst();

// findAny - get any element (useful for parallel streams)
Optional<Integer> any = numbers.stream()
    .filter(n -> n % 2 == 0)
    .findAny();

// anyMatch, allMatch, noneMatch
boolean hasEven = numbers.stream().anyMatch(n -> n % 2 == 0);
boolean allPositive = numbers.stream().allMatch(n -> n > 0);
boolean noNegative = numbers.stream().noneMatch(n -> n < 0);

// min, max
Optional<Integer> min = numbers.stream().min(Integer::compare);
Optional<Integer> max = numbers.stream().max(Integer::compare);
```

**Collectors - Advanced Collecting:**

```java
List<String> strings = Arrays.asList("apple", "banana", "apple", "cherry");

// Collectors.toList
List<String> list = strings.stream()
    .collect(Collectors.toList());

// Collectors.toSet
Set<String> set = strings.stream()
    .collect(Collectors.toSet());

// Collectors.toMap
Map<String, Integer> map = strings.stream()
    .collect(Collectors.toMap(
        s -> s,           // key
        s -> s.length()   // value
    ));

// Collectors.joining
String joined = strings.stream()
    .collect(Collectors.joining(", "));  // apple, banana, apple, cherry

// Collectors.groupingBy
Map<Integer, List<String>> byLength = strings.stream()
    .collect(Collectors.groupingBy(String::length));
    // {5=[apple], 6=[banana, cherry]}

// Collectors.partitioningBy (boolean key)
Map<Boolean, List<String>> byEvenLength = strings.stream()
    .collect(Collectors.partitioningBy(s -> s.length() % 2 == 0));
    // {false=[apple, banana, cherry], true=[]}

// Collectors.summarizingInt
IntSummaryStatistics stats = strings.stream()
    .collect(Collectors.summarizingInt(String::length));
System.out.println(stats.getSum());     // 25
System.out.println(stats.getAverage()); // 5.0
System.out.println(stats.getCount());   // 5
```

**Real-World Example:**

```java
class Order {
    String id;
    String customer;
    double amount;
    LocalDate date;

    // Constructor, getters...
}

List<Order> orders = Arrays.asList(
    new Order("1", "Alice", 100, LocalDate.of(2024, 1, 1)),
    new Order("2", "Bob", 200, LocalDate.of(2024, 1, 2)),
    new Order("3", "Alice", 150, LocalDate.of(2024, 1, 3))
);

// Total amount by customer
Map<String, Double> totalByCustomer = orders.stream()
    .collect(Collectors.groupingBy(
        Order::getCustomer,
        Collectors.summingDouble(Order::getAmount)
    ));
// {Alice=250, Bob=200}

// Orders grouped by date
Map<LocalDate, List<Order>> byDate = orders.stream()
    .collect(Collectors.groupingBy(Order::getDate));

// High-value orders (>150) by customer
Map<String, List<Order>> highValueOrders = orders.stream()
    .filter(o -> o.getAmount() > 150)
    .collect(Collectors.groupingBy(Order::getCustomer));
```

**Performance Considerations:**

```java
// ❌ Creating multiple streams (inefficient)
long count = numbers.stream().filter(n -> n > 5).count();
double average = numbers.stream().filter(n -> n > 5).mapToDouble(Integer::doubleValue).average().orElse(0);

// ✓ Reuse stream chain
List<Integer> filtered = numbers.stream()
    .filter(n -> n > 5)
    .collect(Collectors.toList());

long count = filtered.size();
double average = filtered.stream()
    .mapToDouble(Integer::doubleValue)
    .average()
    .orElse(0);

// Parallel streams for large data
List<Integer> largeList = generateMillionIntegers();
long count = largeList.parallelStream()  // Multi-threaded
    .filter(n -> n % 2 == 0)
    .count();
```

---

## Question 3: Optional - Handling null values

### Answer:

`Optional<T>` is a container for an optional value (either present or empty).

```java
// Creating Optional
Optional<String> empty = Optional.empty();
Optional<String> ofValue = Optional.of("Hello");  // NPE if null
Optional<String> ofNullable = Optional.ofNullable(null);  // Safe

// Checking if value is present
Optional<String> opt = Optional.of("Hello");
if (opt.isPresent()) {
    System.out.println(opt.get());
}

// ifPresent - execute if value present
opt.ifPresent(System.out::println);

// ifPresentOrElse (Java 9+)
opt.ifPresentOrElse(
    System.out::println,
    () -> System.out.println("Value not present")
);

// orElse - default value
String result = opt.orElse("default");

// orElseGet - lazy default value
String result2 = opt.orElseGet(() -> "generated default");

// orElseThrow - throw if empty
String value = opt.orElseThrow(() -> new IllegalArgumentException("Empty!"));

// map - transform value if present
Optional<Integer> length = opt.map(String::length);

// flatMap - chain operations
Optional<Integer> result3 = opt
    .flatMap(s -> Optional.of(s.length()))
    .flatMap(l -> Optional.ofNullable(l > 5 ? l : null));

// filter - keep if predicate true
Optional<String> filtered = opt.filter(s -> s.length() > 3);
```

**Common Patterns:**

```java
// ❌ Bad: Using Optional like this
if (opt.isPresent()) {
    value = opt.get();
} else {
    value = "default";
}

// ✓ Good:
value = opt.orElse("default");

// ❌ Bad: Unnecessary Optional
Optional<List<String>> items = Optional.of(new ArrayList<>());
if (items.isPresent()) {
    List<String> list = items.get();
}

// ✓ Good: Use directly if known to be non-null
List<String> list = new ArrayList<>();

// ✓ Good: Chain operations
String name = user.map(User::getName)
    .map(String::toUpperCase)
    .orElse("UNKNOWN");
```

**Real-World Example:**

```java
class User {
    String name;
    String email;
    Optional<String> phone;  // Optional field

    public Optional<String> getPhone() {
        return phone;
    }
}

// Safe extraction chain
User user = findUser("123");
String phone = Optional.ofNullable(user)
    .flatMap(User::getPhone)
    .filter(p -> p.matches("\\d{10}"))
    .map(p -> p.substring(0, 3) + "-" + p.substring(3))
    .orElse("Not available");
```

---

## Question 4: Default Methods and Static Methods in Interfaces (Java 8)

### Answer:

**Default Methods:**

Before Java 8, you couldn't add methods to interfaces without breaking implementations. Default methods solve this.

```java
public interface PaymentProcessor {
    void process(double amount);

    // Default method - has implementation
    default void logTransaction(double amount) {
        System.out.println("Processing: $" + amount);
    }

    // Can be overridden
    default double applyTax(double amount) {
        return amount * 1.1;
    }
}

public class CreditCardProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        logTransaction(amount);
        double taxed = applyTax(amount);
        System.out.println("Charging: $" + taxed);
    }
}

// Usage
PaymentProcessor processor = new CreditCardProcessor();
processor.process(100);  // Uses default logTransaction and applyTax
```

**Static Methods in Interfaces:**

```java
public interface Converter {
    String convert(int value);

    // Static method - belongs to interface, not instances
    static Converter hexConverter() {
        return value -> Integer.toHexString(value);
    }

    static Converter binaryConverter() {
        return value -> Integer.toBinaryString(value);
    }
}

// Usage - called on interface itself
Converter hex = Converter.hexConverter();
System.out.println(hex.convert(255));  // "ff"

Converter binary = Converter.binaryConverter();
System.out.println(binary.convert(255));  // "11111111"
```

**Multiple Inheritance Diamond Problem:**

```java
interface Interface1 {
    default void display() {
        System.out.println("From Interface1");
    }
}

interface Interface2 {
    default void display() {
        System.out.println("From Interface2");
    }
}

// ❌ Compile error - ambiguous
class Implementation implements Interface1, Interface2 {
    // Which default display() to use?
}

// ✓ Solution: Override and choose
class Implementation implements Interface1, Interface2 {
    @Override
    public void display() {
        Interface1.super.display();  // Explicitly choose Interface1
    }
}
```

---

## Question 5: Date/Time API (Java 8) - LocalDate, LocalDateTime, ZonedDateTime

### Answer:

The old `java.util.Date` was mutable and error-prone. Java 8 introduced immutable date/time classes.

```java
// Creating dates
LocalDate today = LocalDate.now();
LocalDate specificDate = LocalDate.of(2024, Month.JANUARY, 15);
LocalDate parse = LocalDate.parse("2024-01-15");

// LocalDate operations
LocalDate tomorrow = today.plusDays(1);
LocalDate nextYear = today.plusYears(1);
LocalDate lastMonth = today.minusMonths(1);

System.out.println(today.getDayOfWeek());     // THURSDAY
System.out.println(today.getDayOfYear());     // 15
System.out.println(today.isLeapYear());       // false

// LocalTime
LocalTime now = LocalTime.now();
LocalTime specificTime = LocalTime.of(14, 30, 0);
LocalTime parse2 = LocalTime.parse("14:30:00");

// LocalDateTime
LocalDateTime dateTime = LocalDateTime.now();
LocalDateTime specific = LocalDateTime.of(
    LocalDate.of(2024, Month.JANUARY, 15),
    LocalTime.of(14, 30)
);

// ZonedDateTime - with timezone
ZonedDateTime zonedNow = ZonedDateTime.now();
ZonedDateTime tokyo = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
ZonedDateTime nyc = ZonedDateTime.now(ZoneId.of("America/New_York"));

// Conversions
Instant instant = Instant.now();  // UTC timestamp
LocalDateTime fromInstant = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());

// Duration and Period
LocalDate date1 = LocalDate.of(2024, Month.JANUARY, 1);
LocalDate date2 = LocalDate.of(2024, Month.JANUARY, 15);
Period period = Period.between(date1, date2);
System.out.println(period.getDays());  // 14

LocalTime time1 = LocalTime.of(10, 0);
LocalTime time2 = LocalTime.of(14, 30);
Duration duration = Duration.between(time1, time2);
System.out.println(duration.toMinutes());  // 270

// Formatting
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String formatted = LocalDateTime.now().format(formatter);
```

---

## Question 6: Records (Java 14-16) - Immutable Data Classes

### Answer:

Records provide a concise way to create immutable data classes.

```java
// Before Java 14: Lots of boilerplate
class PersonOld {
    private final String name;
    private final int age;

    public PersonOld(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof PersonOld)) return false;
        PersonOld other = (PersonOld) obj;
        return Objects.equals(name, other.name) && age == other.age;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() {
        return "PersonOld{" + "name='" + name + '\'' + ", age=" + age + '}';
    }
}

// Java 14+: Records (all above generated automatically)
record Person(String name, int age) {}

// Usage
Person p1 = new Person("Alice", 30);
Person p2 = new Person("Alice", 30);

System.out.println(p1);              // Person[name=Alice, age=30]
System.out.println(p1.equals(p2));   // true
System.out.println(p1.hashCode());   // Generated
System.out.println(p1.name());       // Alice (accessor)
```

**Record Features:**

```java
// Compact constructor
record Point(int x, int y) {
    public Point {  // Compact constructor syntax
        if (x < 0 || y < 0) {
            throw new IllegalArgumentException("Negative coordinates");
        }
    }
}

// Custom methods
record Employee(String name, double salary) {
    public boolean isHighEarner() {
        return salary > 100000;
    }

    public static Employee fromCSV(String csv) {
        String[] parts = csv.split(",");
        return new Employee(parts[0], Double.parseDouble(parts[1]));
    }
}

// Sealed records (Java 15+)
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}
```

---

## Question 7: Pattern Matching (Java 16, 17, 21+)

### Answer:

Pattern matching simplifies type checking and extraction.

**Type Pattern (Java 16):**

```java
// Before Java 16
Object obj = "Hello";
if (obj instanceof String) {
    String str = (String) obj;  // Redundant cast
    System.out.println(str.length());
}

// Java 16+ Type pattern
if (obj instanceof String str) {
    System.out.println(str.length());  // str in scope
}

// In switch (Java 17)
String result = switch (obj) {
    case String s -> "String: " + s;
    case Integer i -> "Integer: " + i;
    case Double d -> "Double: " + d;
    default -> "Unknown";
};
```

**Record Pattern (Java 19):**

```java
record Point(int x, int y) {}
record Circle(Point center, int radius) {}

Object shape = new Circle(new Point(10, 20), 5);

// Before Java 19
if (shape instanceof Circle) {
    Circle c = (Circle) shape;
    if (c.center() instanceof Point) {
        Point p = c.center();
        System.out.println("Center: " + p.x() + ", " + p.y());
    }
}

// Java 19+ Record pattern
if (shape instanceof Circle(Point(int x, int y), int r)) {
    System.out.println("Center: " + x + ", " + y + ", Radius: " + r);
}

// In switch
String info = switch (shape) {
    case Circle(Point(int x, int y), int r) ->
        "Circle at (" + x + "," + y + ") with radius " + r;
    case Point(int x, int y) ->
        "Point at (" + x + "," + y + ")";
    default -> "Unknown";
};
```

---

## Question 8: Virtual Threads (Java 19 - Project Loom)

### Answer:

Virtual threads are lightweight threads managed by the JVM, not OS threads.

```java
// Before Java 19: Platform threads (OS threads - expensive)
new Thread(() -> {
    System.out.println("Platform thread");
}).start();

// Java 19+: Virtual threads (lightweight - millions can exist)
Thread.ofVirtual().start(() -> {
    System.out.println("Virtual thread");
});

// Creating many virtual threads (efficient)
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

for (int i = 0; i < 1_000_000; i++) {
    executor.submit(() -> {
        System.out.println("Task " + Thread.currentThread());
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
}

executor.shutdown();
executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

// StructuredConcurrency (Java 19+ - Project Loom)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> future1 = scope.fork(() -> fetchData1());
    Future<String> future2 = scope.fork(() -> fetchData2());

    scope.join();  // Wait for all
    String result1 = future1.resultNow();
    String result2 = future2.resultNow();
}
```

**Benefits of Virtual Threads:**

```
Platform Threads (OS threads):
├─ 1000s per JVM (limited by OS)
├─ Heavy memory footprint (1-2MB per thread)
└─ Context switching overhead

Virtual Threads (Lightweight):
├─ Millions per JVM
├─ Minimal memory footprint (few KB)
└─ Scheduled by JVM (no context switch to OS)
```

---

## Question 9: Java 9+ platform and language feature highlights

### Answer:

**Java Platform and Tooling:**

- `JShell` - interactive REPL for Java.
- `jlink` - create custom runtime images containing only required modules.
- `jdeps` - analyze dependencies and find unused modules.

**Module System (Java 9):**

- `module-info.java` defines module exports and dependencies.
- Promotes strong encapsulation and reliable configuration.

```java
module com.example.app {
    requires java.sql;
    exports com.example.app.service;
}
```

**Modern language additions:**

- `var` - local variable type inference.
- `List.of()`, `Set.of()`, `Map.of()` - immutable collection factories.
- `HttpClient` API - modern HTTP client built into the JDK.
- `String` enhancements: `repeat()`, `isBlank()`, `lines()`, `strip()`.
- `String Templates` / formatted strings (preview / Java 21+ concept).

**Example:**

```java
var numbers = List.of(1, 2, 3);
var client = HttpClient.newHttpClient();
var request = HttpRequest.newBuilder()
    .uri(URI.create("https://example.com"))
    .GET()
    .build();

HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
System.out.println(response.body());
```

**Foreign Function & Memory API (Incubator):**

- Provides safer access to native libraries.
- Replaces JNI for many use cases with a higher-level API.

**Why these matter for senior developers:**

- Better modularity and encapsulation.
- Reduced runtime footprint when using `jlink`.
- Cleaner code with immutable collection factories.
- Stronger HTTP client support without third-party dependencies.

**Follow-up Questions:**

1. When should you use `List.of()` instead of `new ArrayList<>()`?
2. What are the trade-offs of `var`?
3. How does the module system improve large applications?

---

## Summary

**Evaluator Checklist:**

- [ ] Comfortable with Streams API
- [ ] Understands Lambdas and functional interfaces
- [ ] Knows Optional usage
- [ ] Familiar with newer features (Records, Pattern Matching)
- [ ] Aware of Virtual Threads benefits

**Red Flags:**

- Doesn't know Lambda syntax
- Can't write Stream operations
- Still uses old Date API
- Not familiar with Records

**Green Flags:**

- Writes clean functional code
- Uses Optional properly
- Aware of virtual thread performance benefits
- Can explain pattern matching use cases
