# Chapter 10: AI & Copilot-Related Questions

## Overview

AI-powered development tools like GitHub Copilot are transforming development. Understanding their capabilities, limitations, and proper usage is increasingly important for senior developers.

---

## Question 1: GitHub Copilot Capabilities and Limitations

### Answer:

**What GitHub Copilot Can Do:**

1. **Code Generation:**

```java
// User starts typing, Copilot suggests completion
public class UserService {
    private UserRepository repository;

    // Copilot suggests:
    public List<User> findActiveUsers() {
        return repository.findAll().stream()
            .filter(u -> u.isActive())
            .collect(Collectors.toList());
    }
}
```

2. **Documentation Generation:**

```java
// Copilot generates Javadoc from method signature
/**
 * Calculates the sum of two integers.
 *
 * @param a the first integer
 * @param b the second integer
 * @return the sum of a and b
 */
public int add(int a, int b) {
    return a + b;
}
```

3. **Test Generation:**

```java
// Given method, Copilot suggests tests
@Test
public void testAdd() {
    UserService service = new UserService();
    assertEquals(5, service.add(2, 3));
    assertEquals(0, service.add(-2, 2));
    assertEquals(-5, service.add(-2, -3));
}
```

4. **Bug Fixing:**

```java
// Copilot can suggest fixes for common patterns
// ❌ Original
List<Integer> list = new ArrayList<>();
list.add(1);
list.remove(new Integer(1));  // Works but not obvious

// ✓ Copilot might suggest
List<Integer> list = new ArrayList<>();
list.add(1);
list.remove(0);  // Remove by index
```

**What Copilot Cannot Do Well:**

1. **Complex Business Logic:**

```java
// Hard: Copilot struggles with domain-specific algorithms
public class InventoryOptimizer {
    // Determining optimal inventory levels requires deep domain knowledge
    // Copilot won't know your specific constraints
    public int calculateOptimalLevel() {
        // ???
    }
}
```

2. **Architectural Decisions:**

```
- Should we use CQRS pattern?
- Should we split into microservices?
- Should we use event sourcing?

Copilot can't make these strategic decisions.
```

3. **Performance Optimization:**

```java
// Copilot doesn't understand performance requirements
// May generate working but inefficient code
public List<Order> findOrders(List<Integer> ids) {
    // Copilot might generate N+1 query
    return ids.stream()
        .map(id -> orderRepository.findById(id).orElse(null))
        .collect(Collectors.toList());

    // Better would be
    // return orderRepository.findAllById(ids);
}
```

4. **Security Issues:**

```java
// ❌ Copilot might not catch security issues
String query = "SELECT * FROM users WHERE id = " + userId;  // SQL Injection!

// ✓ Better
String query = "SELECT * FROM users WHERE id = ?";
ps.setString(1, userId);  // Parameterized query
```

---

## Question 2: Best Practices for Using AI-Assisted Development

### Answer:

**Do's:**

```java
// ✓ Use Copilot for boilerplate code
// - Getters/setters
// - toString(), equals(), hashCode()
// - Simple CRUD operations
// - Test templates

@Data  // Lombok can replace this completely
public class User {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
}

// ✓ Use for generating documentation
// Good starting point for Javadoc

// ✓ Use for exploring unfamiliar libraries
// Copilot knows common patterns for Spring, Kafka, etc.

// ✓ Use as learning tool
// See how experienced developers structure code
```

**Don'ts:**

```java
// ✗ Don't accept code without review
// Always understand what it generates

// ✗ Don't ignore security warnings
List<String> userInput = getUserInput();
// Even if Copilot suggests direct SQL, validate input

// ✗ Don't let Copilot guide architecture
// Should be human decision

// ✗ Don't copy-paste from Copilot blindly
// Verify it matches your context and requirements

// ✗ Don't use for system-critical code without review
// Medical systems, financial systems need human review
```

**Workflow:**

```
1. PLAN
   ├─ Understand requirements
   ├─ Design architecture
   └─ Define interfaces

2. USE COPILOT for implementation
   ├─ Generate boilerplate
   ├─ Fill in logic
   └─ Generate tests

3. REVIEW carefully
   ├─ Check logic correctness
   ├─ Verify security
   ├─ Test performance
   └─ Ensure consistency

4. TEST thoroughly
   ├─ Unit tests
   ├─ Integration tests
   └─ Security tests

5. DOCUMENT
   ├─ Add business logic comments
   ├─ Explain non-obvious code
   └─ Keep documentation accurate
```

---

## Question 3: Detecting AI-Generated Code Issues

### Answer:

**Common Copilot Mistakes:**

**1. Hallucinated Methods:**

```java
// ❌ Copilot might suggest non-existent methods
User user = userRepository.findByEmailAndActive("test@example.com", true);
// Method doesn't exist!

// Check before using
// Better: Write query yourself or verify method exists
@Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
Optional<User> findByEmailAndActive(@Param("email") String email,
                                   @Param("active") boolean active);
```

**2. N+1 Query Problems:**

```java
// ❌ Copilot might not understand JPA relationships
List<Order> orders = orderRepository.findAll();
for (Order order : orders) {
    System.out.println(order.getCustomer().getName());  // N+1 queries!
}

// ✓ Better: Use JOIN FETCH
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.customer")
List<Order> findAllWithCustomer();
```

**3. Memory Leaks:**

```java
// ❌ Static collection that grows forever
public class Cache {
    private static List<Object> cache = new ArrayList<>();

    public void add(Object obj) {
        cache.add(obj);  // Never cleared!
    }
}

// ✓ Use proper caching library
private final Map<String, Object> cache =
    new LinkedHashMap<String, Object>(100, 0.75f, true) {
        protected boolean removeEldestEntry(Map.Entry eldest) {
            return size() > 100;
        }
    };
```

**4. Thread Safety Issues:**

```java
// ❌ Copilot might not consider concurrency
private int counter = 0;

public void increment() {
    counter++;  // Race condition!
}

// ✓ Better
private AtomicInteger counter = new AtomicInteger(0);

public void increment() {
    counter.incrementAndGet();
}

// Or
private int counter = 0;

public synchronized void increment() {
    counter++;
}
```

**5. Incorrect Exception Handling:**

```java
// ❌ Swallowing exceptions
try {
    processPayment();
} catch (Exception e) {
    // Silently fails - very bad!
}

// ✓ Better
try {
    processPayment();
} catch (PaymentException e) {
    log.error("Payment failed", e);
    orderService.cancelOrder(order);
    throw e;
}
```

---

## Question 4: Prompt Engineering for Better Results

### Answer:

**Good Prompts (in code comments):**

```java
// Bad prompt (vague):
// write a method to get users

// Good prompt (specific):
// Get all users with role ADMIN who have been active in the last 30 days,
// sorted by last_login_date descending
public List<User> getRecentAdminUsers() {
    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
    return userRepository.findByRoleAndLastLoginAfter(
        UserRole.ADMIN,
        thirtyDaysAgo
    );
}
```

**Provide Context:**

```java
// ✓ Copilot does better with context
// We're using Spring Data JPA with PostgreSQL
// User entity has roles, lastLoginDate, and email fields
// We need pagination support

@Query("SELECT u FROM User u WHERE u.role = :role " +
       "AND u.lastLogin > :date ORDER BY u.lastLogin DESC")
Page<User> findActiveAdminUsers(
    @Param("role") UserRole role,
    @Param("date") LocalDateTime date,
    Pageable pageable
);
```

**Specify Technology:**

```java
// ✓ Mention frameworks and versions
// Generate a Spring Boot REST controller with:
// - GET /api/users/{id} - fetch user
// - POST /api/users - create user
// - PUT /api/users/{id} - update user
// - Using Spring Data JPA and validation

@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    // Copilot now knows the tech stack
}
```

**Ask for Testing:**

```java
// ✓ Request test generation
// Generate unit tests for UserService.validateEmail(String email)
// Should test: valid email, invalid email, null, empty string, edge cases

@Test
public void testValidateEmailValidFormat() {
    assertTrue(userService.validateEmail("test@example.com"));
}

@Test
public void testValidateEmailInvalidFormat() {
    assertFalse(userService.validateEmail("invalid"));
}

// ... more tests
```

---

## Question 5: What is prompt engineering and why does it matter?

### Answer:

Prompt engineering is the practice of writing clear, specific instructions so the AI produces better output.

**Good prompting principles:**

1. Be specific about the task
2. Provide context and constraints
3. Ask for the format you want
4. Break large tasks into smaller steps
5. Give examples when possible

```text
Bad prompt:
Write a Java service.

Better prompt:
Write a Spring Boot service for user registration.
Use DTOs, validation, and a repository layer.
Return a JSON response and include unit tests.
```

**Why it matters:**

- Better prompts reduce hallucinations.
- They improve accuracy and relevance.
- They save time because fewer iterations are needed.

**Common prompt patterns:**

```text
Role + task + context + constraints + output format
Example:
You are a senior Java engineer.
Generate a REST controller for user creation.
Use Spring Boot 3, validation, and DTOs.
Return only Java code and a short explanation.
```

---

## Question 6: What is the difference between an LLM and a model?

### Answer:

An LLM is a type of model, but not every model is an LLM.

**LLM (Large Language Model):**

- Trained on large amounts of text data.
- Good at language tasks like summarization, generation, Q&A, reasoning, and code assistance.

**Model:**

- A general term for a trained machine learning system.
- Models can be for vision, speech, classification, ranking, embeddings, or text generation.

**Example:**

- GPT-style systems are LLMs.
- A recommendation model or image generation model is not an LLM.

**Interview angle:**

- Candidates should understand that "model" is broader than "LLM".
- Different tasks need different model categories.

---

## Question 7: Which model should be used for what purpose?

### Answer:

Model choice depends on the job.

**Use cases:**

- Code generation: strong coding models for autocomplete, refactoring, tests
- Summarization: models optimized for long-context understanding
- Chat / support: conversational models with good reasoning
- Classification / tagging: smaller models may be enough
- Embeddings: models built for similarity and retrieval
- Image generation: image models, not text-only models

**Practical examples:**

```text
Use a coding-focused model for:
- code completion
- unit test generation
- API scaffolding

Use a general-purpose model for:
- brainstorming
- documentation drafting
- explaining architecture

Use a smaller/faster model for:
- simple classification
- lightweight chat assistants
- low-latency tasks
```

**Senior developer expectation:**

- Understand that there is no single best model for everything.
- Choose based on quality, latency, cost, and context needs.

---

## Question 8: How can a team save tokens or credits while using AI tools?

### Answer:

Saving tokens or credits is important for cost control and performance.

**Practical ways to reduce cost:**

1. Use smaller models for simple tasks
2. Give concise prompts instead of long, repeated context
3. Reuse context carefully instead of sending the same content repeatedly
4. Break large tasks into smaller requests
5. Ask for short outputs when possible
6. Use retrieval-based approaches instead of dumping huge files into prompts
7. Cache common responses when appropriate

**Example:**

```text
Expensive approach:
Send the whole codebase and ask for a full refactor.

Cheaper approach:
Send only the relevant file, the requirement, and the expected output format.
```

**Best practices:**

- Provide only the context that is necessary.
- Use clear instructions to avoid multiple retries.
- Use model routing: cheap model for simple tasks, stronger model for complex logic.

---

## Question 9: What is the use of custom instructions?

### Answer:

Custom instructions are reusable preferences or rules that guide the AI on how to respond.

**Typical uses:**

- Always use Java 17+ examples
- Prefer Spring Boot conventions
- Avoid using Lombok unless requested
- Keep responses concise and structured
- Follow company coding standards
- Avoid writing insecure code

**Example:**

```text
Custom instructions:
- Prefer clean Java code with clear naming.
- Use Spring Boot 3 conventions.
- Avoid over-explaining.
- Include unit tests when generating business logic.
```

**Why they are useful:**

- Improve consistency across prompts.
- Reduce repetitive instructions.
- Help teams align to coding standards and preferred style.

**Interview angle:**

- Senior developers should see custom instructions as a productivity and governance tool, not just a convenience feature.

---

## Question 10: Impact of AI on Software Development

### Answer:

**Positive Impacts:**

1. **Increased Productivity:**
   - 30-50% faster code writing (studies show)
   - Less time on boilerplate
   - More time on logic and design

2. **Lower Barrier to Entry:**
   - Junior developers can write more sophisticated code
   - Reduced learning curve
   - Better code examples available

3. **Faster Prototyping:**
   - Quickly try different approaches
   - Iterate on designs
   - Proof of concepts faster

4. **Knowledge Distribution:**
   - Best practices available to all
   - Reduces knowledge silos
   - Levels the playing field

**Negative Impacts:**

1. **Code Quality Concerns:**
   - Generated code may have bugs
   - Security vulnerabilities
   - Performance issues
   - Technical debt

2. **Over-reliance:**
   - Developers may not understand generated code
   - Reduced learning
   - Debugging becomes harder

3. **IP and Legal Issues:**
   - Training data sources unclear
   - Copyright concerns
   - License compatibility

4. **Security Risks:**
   - Vulnerable code patterns
   - Hardcoded secrets (if training data had them)
   - False sense of security

**Senior Developer Responsibility:**

```
As a senior developer using AI tools:

1. REVIEW THOROUGHLY
   - Don't ship AI code without review
   - Check security implications
   - Verify performance

2. EDUCATE JUNIOR DEVELOPERS
   - Show when to use/not use AI
   - Explain generated code
   - Build understanding

3. MAINTAIN STANDARDS
   - Code quality shouldn't decline
   - Security standards must be enforced
   - Document AI usage

4. STAY CRITICAL
   - Question AI suggestions
   - Verify correctness
   - Trust but verify

5. USE RESPONSIBLY
   - Don't over-rely on AI
   - Keep learning core skills
   - Develop critical thinking
```

**Example: Responsible Usage**

```java
// ❌ Bad: Accept Copilot suggestion without question
@Override
public String toString() {
    return "User{" +
            "id=" + id +
            ", email='" + email + '\'' +
            '}';
}

// ✓ Good: Review and enhance
@Override
public String toString() {
    return "User{" +
            "id=" + id +
            ", email='" + email + '\'' +
            ", createdAt=" + createdAt +  // Added context
            ", active=" + active +         // Added important field
            '}';
}

// ✓ Better: Use Lombok
@ToString
public class User {
    private Long id;
    private String email;
    private LocalDateTime createdAt;
    private boolean active;
}
```

---

## Summary

**Key Takeaways for Interviewer:**

Assess candidate's understanding of:

1. **AI capabilities and limitations** - Not a magic wand
2. **Code quality mindset** - Doesn't lower standards
3. **Security awareness** - Still critical with AI
4. **Responsibility** - Senior developers guide usage
5. **Judgment** - When to use/not use AI

**Green Flags:**

- Understands limitations
- Reviews code critically
- Focuses on learning
- Considers security
- Uses as assistant, not replacement

**Red Flags:**

- Uncritical acceptance of AI suggestions
- Over-reliance on AI
- Dismissive of human judgment
- Not concerned about code quality
- Security vulnerabilities in AI code
