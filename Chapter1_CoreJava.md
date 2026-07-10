# Chapter 1: Core Java Fundamentals

## Overview

This chapter covers fundamental Java concepts that a senior developer should have mastered, focusing on OOP principles, access modifiers, final keyword, and core language features.

---

## Question 1: Explain the difference between `==` and `.equals()` method

### Answer:

`==` is a reference comparison operator, while `.equals()` is a value comparison method.

**Key Differences:**

```java
// == compares references (memory addresses)
String s1 = new String("Hello");
String s2 = new String("Hello");
System.out.println(s1 == s2);        // false (different objects)
System.out.println(s1.equals(s2));   // true (same content)

// String literal pool
String s3 = "Hello";
String s4 = "Hello";
System.out.println(s3 == s4);        // true (same reference in pool)
System.out.println(s3.equals(s4));   // true (same content)

// Integer comparison
Integer a = 128;
Integer b = 128;
System.out.println(a == b);          // false (different objects)
System.out.println(a.equals(b));     // true

// But with caching
Integer c = 100;
Integer d = 100;
System.out.println(c == d);          // true (cached in [-128, 127])
```

**When to override `.equals()` and `.hashCode()`:**

```java
public class Employee {
    private int id;
    private String name;

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Employee emp = (Employee) obj;
        return id == emp.id && Objects.equals(name, emp.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}
```

**Follow-up Questions:**

1. Why must you override both `equals()` and `hashCode()`?
2. What's the purpose of string literal pool?
3. When would you use `==` for object comparison?

---

## Question 2: Explain access modifiers and their visibility scope

### Answer:

Java has 4 access levels:

| Modifier              | Same Class | Same Package | Subclass | Outside |
| --------------------- | ---------- | ------------ | -------- | ------- |
| private               | ✓          | ✗            | ✗        | ✗       |
| default (no modifier) | ✓          | ✓            | ✗        | ✗       |
| protected             | ✓          | ✓            | ✓        | ✗       |
| public                | ✓          | ✓            | ✓        | ✓       |

**Practical Examples:**

```java
// Private - only accessible within the class
public class BankAccount {
    private double balance;

    public void withdraw(double amount) {
        if (isValidWithdrawal(amount)) {
            balance -= amount;
        }
    }

    private boolean isValidWithdrawal(double amount) {
        return amount <= balance;
    }
}

// Default - package private
class InternalHelper {  // No modifier = package private
    void process() { }
}

// Protected - accessible in subclasses
public class Animal {
    protected void makeSound() { }
}

public class Dog extends Animal {
    @Override
    protected void makeSound() {
        System.out.println("Woof!");
    }
}

// Public - accessible everywhere
public class Service {
    public void publicMethod() { }
}
```

**Best Practices:**

- Default to `private`
- Use `protected` for inheritance hierarchies
- Use `public` only for API boundaries
- Never use package-private for library APIs

---

## Question 3: What is the `final` keyword and its multiple uses?

### Answer:

The `final` keyword can be applied to variables, methods, and classes with different meanings:

**1. Final Variables (Constants):**

```java
// Once assigned, cannot be changed
final int MAX_SIZE = 100;
// MAX_SIZE = 200;  // Compile error

// Immutable reference (but object can be modified)
final List<String> names = new ArrayList<>();
names.add("John");  // OK - modifying object
// names = new ArrayList<>();  // Compile error - cannot reassign

// Blank final - must be initialized before use
class MyClass {
    final String id;

    MyClass(String id) {
        this.id = id;  // Must initialize in constructor
    }
}
```

**2. Final Methods (Cannot be overridden):**

```java
public class Parent {
    final void criticalOperation() {
        // Subclasses cannot override this
        System.out.println("This is critical!");
    }
}

public class Child extends Parent {
    // void criticalOperation() { }  // Compile error
}
```

**3. Final Classes (Cannot be extended):**

```java
final class Immutable {
    // Cannot be subclassed
}

// class SubClass extends Immutable { }  // Compile error

// Examples of final classes in Java
final class String { }
final class Integer { }
```

**Performance Benefits:**

- JIT compiler can optimize final methods (inlining)
- Final variables enable better optimizations
- Example:

```java
public class Example {
    public final int getValue() {
        return 42;
    }
}

// JIT compiler can inline this directly
int value = example.getValue();  // Can be replaced with 42 at compile time
```

**Follow-up Questions:**

1. Can a final variable be left uninitialized?
2. What's the difference between immutability and final?
3. Why is String class final?

---

## Question 4: Explain immutability and how to create an immutable class

### Answer:

An immutable object cannot be changed after creation. Immutable objects are thread-safe and can be safely shared.

**Rules for Creating Immutable Classes:**

```java
public final class ImmutableEmployee {
    // 1. Make class final

    // 2. Make all fields private and final
    private final int id;
    private final String name;
    private final LocalDate joinDate;
    private final List<String> skills;

    // 3. Initialize all fields via constructor
    public ImmutableEmployee(int id, String name,
                            LocalDate joinDate,
                            List<String> skills) {
        this.id = id;
        this.name = name;
        this.joinDate = joinDate;
        // 4. Make defensive copies of mutable objects
        this.skills = new ArrayList<>(skills);
    }

    // 5. Provide getters, but no setters
    public int getId() { return id; }
    public String getName() { return name; }
    public LocalDate getJoinDate() { return joinDate; }

    // 6. Return defensive copies for mutable objects
    public List<String> getSkills() {
        return new ArrayList<>(skills);
    }

    // 7. Override equals() and hashCode()
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof ImmutableEmployee)) return false;
        ImmutableEmployee other = (ImmutableEmployee) obj;
        return id == other.id &&
               Objects.equals(name, other.name) &&
               Objects.equals(joinDate, other.joinDate) &&
               Objects.equals(skills, other.skills);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, joinDate, skills);
    }

    // 8. Override toString() if needed
    @Override
    public String toString() {
        return "ImmutableEmployee{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", joinDate=" + joinDate +
                ", skills=" + skills +
                '}';
    }
}
```

**Benefits of Immutability:**

```java
// Thread-safe without synchronization
List<ImmutableEmployee> employees = new ArrayList<>();
// Can be safely accessed from multiple threads

// Can be used as HashMap keys
Map<ImmutableEmployee, String> map = new HashMap<>();
map.put(employee, "data");

// Caching is safe
ImmutableEmployee cached = employee;
// Value will never change
```

**Common Mistakes:**

```java
// ❌ WRONG: Still mutable due to List
public class WrongImmutable {
    private final List<String> items;

    public WrongImmutable(List<String> items) {
        this.items = items;  // NO! External reference can modify
    }

    public List<String> getItems() {
        return items;  // NO! Caller can modify
    }
}

// ✓ CORRECT: Using Collections.unmodifiableList()
public class CorrectImmutable {
    private final List<String> items;

    public CorrectImmutable(List<String> items) {
        this.items = Collections.unmodifiableList(
            new ArrayList<>(items)
        );
    }

    public List<String> getItems() {
        return items;  // Safe - cannot be modified
    }
}
```

**Follow-up Questions:**

1. Why is immutability important for multi-threading?
2. Can you make a mutable object reference immutable?
3. What's the performance impact of immutability?

---

## Question 5: What are static variables and methods? When should they be used?

### Answer:

Static members belong to the class, not to instances. There's only one copy shared across all instances.

**Static Variables:**

```java
public class Counter {
    private static int count = 0;  // Shared across all instances
    private int id;

    public Counter() {
        id = ++count;  // All instances share this counter
    }

    public int getId() {
        return id;
    }

    public static int getTotalCount() {
        return count;
    }
}

// Usage
Counter c1 = new Counter();  // id = 1, count = 1
Counter c2 = new Counter();  // id = 2, count = 2
System.out.println(Counter.getTotalCount());  // 2
```

**Static Methods:**

```java
public class MathUtils {
    // Cannot access instance variables
    public static int add(int a, int b) {
        return a + b;
    }

    // Can access other static members
    private static final String VERSION = "1.0";

    public static void printVersion() {
        System.out.println(VERSION);
    }
}

// Usage - no need to create instance
System.out.println(MathUtils.add(5, 3));  // 8
MathUtils.printVersion();
```

**Static Initializer Block:**

```java
public class Configuration {
    private static Map<String, String> config;

    static {
        config = new HashMap<>();
        config.put("database.url", "jdbc:mysql://localhost:3306/db");
        config.put("database.user", "root");
        // Executed once when class is loaded
    }

    public static String getConfig(String key) {
        return config.get(key);
    }
}
```

**When to Use Static:**

```java
// ✓ Good: Utility functions
public class StringUtils {
    public static String reverse(String str) {
        return new StringBuilder(str).reverse().toString();
    }
}

// ✓ Good: Constants
public class Constants {
    public static final String APP_NAME = "MyApp";
    public static final int MAX_RETRIES = 3;
}

// ✓ Good: Factory methods
public class Database {
    private static Database instance;

    public static Database getInstance() {
        if (instance == null) {
            instance = new Database();
        }
        return instance;
    }
}

// ❌ Bad: Excessive static usage
public class BadDesign {
    private static List<User> users = new ArrayList<>();  // Hard to test

    public static void addUser(User user) {  // Tight coupling
        users.add(user);
    }
}
```

**Common Pitfalls:**

```java
// Static variables are NOT thread-safe by default
public class Counter {
    private static int count = 0;

    public static void increment() {
        count++;  // Race condition!
    }
}

// Solution: Use synchronization
public class ThreadSafeCounter {
    private static int count = 0;

    public static synchronized void increment() {
        count++;
    }
}
```

---

## Question 6: Explain the difference between `String`, `StringBuffer`, and `StringBuilder`

### Answer:

| Aspect      | String                     | StringBuffer          | StringBuilder   |
| ----------- | -------------------------- | --------------------- | --------------- |
| Mutability  | Immutable                  | Mutable               | Mutable         |
| Thread-Safe | Yes                        | Yes (synchronized)    | No              |
| Performance | Slow (creates new objects) | Slower (synchronized) | Fastest         |
| Use Case    | Immutable strings          | Multi-threaded        | Single-threaded |

**Examples:**

```java
// String - Immutable
String str1 = "Hello";
String str2 = str1.concat(" World");  // Creates new object
// str1 remains "Hello"

// Performance problem
String result = "";
for (int i = 0; i < 1000; i++) {
    result += "x";  // Creates 1000 new String objects!
}

// StringBuffer - Thread-safe, slower
StringBuffer buffer = new StringBuffer();
for (int i = 0; i < 1000; i++) {
    buffer.append("x");  // Single buffer reused
}

// StringBuilder - Not thread-safe, fastest
StringBuilder builder = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    builder.append("x");
}
String result2 = builder.toString();
```

**String Interning:**

```java
String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");
String s4 = s3.intern();  // Gets reference from pool

System.out.println(s1 == s2);  // true (same pool reference)
System.out.println(s1 == s3);  // false (different objects)
System.out.println(s1 == s4);  // true (intern returns pool reference)
```

---

## Question 7: What is the difference between a class and an interface? When would you use each?

### Answer:

**Key Differences:**

| Feature       | Class                       | Interface                                  |
| ------------- | --------------------------- | ------------------------------------------ |
| Instantiation | Can instantiate             | Cannot instantiate                         |
| Methods       | Can be abstract or concrete | Initially abstract, now concrete (Java 8+) |
| Variables     | Any type and modifier       | Public, static, final only                 |
| Constructor   | Can have                    | Cannot have                                |
| Inheritance   | Single inheritance          | Multiple inheritance                       |
| Purpose       | "IS-A" relationship         | "CAN-DO" contract                          |

**Class Example:**

```java
public class Animal {
    private String name;

    public Animal(String name) {
        this.name = name;
    }

    public void sound() {
        System.out.println("Generic sound");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }

    @Override
    public void sound() {
        System.out.println("Woof!");
    }
}
```

**Interface Example (Java 8+):**

```java
public interface Drawable {
    void draw();  // Abstract method

    default void scale(double factor) {  // Default method (Java 8)
        System.out.println("Scaling by " + factor);
    }

    static void staticMethod() {  // Static method (Java 8)
        System.out.println("Static utility");
    }
}

public class Circle implements Drawable {
    @Override
    public void draw() {
        System.out.println("Drawing circle");
    }
}
```

**Multiple Inheritance via Interfaces:**

```java
public interface Flyable {
    void fly();
}

public interface Swimmable {
    void swim();
}

public class Duck implements Flyable, Swimmable {
    @Override
    public void fly() { System.out.println("Flying"); }

    @Override
    public void swim() { System.out.println("Swimming"); }
}
```

**When to Use Each:**

```java
// Use Class for:
// 1. IS-A relationships
public class Car extends Vehicle { }

// 2. Shared implementation
public class Animal {
    public void eat() { System.out.println("Eating"); }
}

// Use Interface for:
// 1. CAN-DO contracts
public interface Serializable { }
public interface Comparable<T> { }

// 2. Multiple behavior contracts
public interface PaymentProcessor {
    void process();
}

public interface AuditableTransaction extends PaymentProcessor {
    void audit();
}
```

---

## Question 8: Explain Java platform components, class loading, and the parent delegation model

### Answer:

**JDK vs JRE vs JVM:**

- JDK (Java Development Kit): tools for compiling, debugging, and packaging Java apps.
- JRE (Java Runtime Environment): runtime libraries and JVM used to execute Java programs.
- JVM (Java Virtual Machine): executes bytecode, manages memory, and provides runtime services.

**Java platform components:**

- `javac` compiles `.java` to `.class` bytecode.
- Class files are loaded by the JVM class loader.
- Bytecode is verified, linked, and executed.
- JIT compiler optimizes hot methods at runtime.

**Class loader hierarchy:**

- Bootstrap ClassLoader: loads core Java classes from the JDK (`rt.jar` / Java runtime).
- Platform/System ClassLoader: loads platform classes and standard extensions.
- Application ClassLoader: loads application classes from the classpath.

**Parent delegation model:**

- A class loader delegates loading to its parent before attempting to load a class itself.
- This prevents duplicate class definitions and ensures core classes are loaded by the bootstrap loader.

```java
ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
System.out.println(classLoader);
System.out.println(classLoader.getParent());
```

**Custom class loaders:**

- Used for sandboxing, plugins, dynamic reloading, or isolation.
- Example: web containers and application servers use custom loaders for each deployment.

```java
public class CustomClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] bytes = loadClassData(name);
        return defineClass(name, bytes, 0, bytes.length);
    }
}
```

**Why class loading matters:**

- Enables dynamic loading of classes at runtime.
- Supports hot deployment and modular application frameworks.
- Affects security, memory footprint, and version isolation.

**Follow-up Questions:**

1. What happens if a class cannot be found by the class loader?
2. How does `Class.forName()` differ from `new`?
3. Why might you want to override `findClass()` instead of `loadClass()`?

---

## Summary

**Key Takeaways for Evaluators:**

1. **Candidate understands OOP principles** - How well do they explain inheritance, polymorphism?
2. **Thread-safety awareness** - Do they think about concurrent access?
3. **Code design** - Do they make good decisions about mutability and access modifiers?
4. **Best practices** - Are they aware of Java conventions and idioms?

**Red Flags:**

- Doesn't understand `==` vs `.equals()`
- Overuses static
- Doesn't consider thread-safety
- Poor understanding of access modifiers

**Green Flags:**

- Explains trade-offs clearly
- Provides practical examples
- Considers performance implications
- Mentions security/immutability concerns
