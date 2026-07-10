# Chapter 11: Additional Topics for Senior Developers

## Overview

Additional critical topics that separate senior developers from mid-level: System Design, Security, JVM Internals, Design Patterns, and DevOps fundamentals.

---

## Question 1: System Design Fundamentals

### Answer:

**Key Components of Scalable Systems:**

```
┌─────────────────────────────────────────┐
│         Load Balancer                   │
│         (Round-robin, LB Hash)          │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│         API Gateway Layer                │
│  (Authentication, Rate limiting, Routing)│
└──────────────┬──────────────────────────┘
               ↓
┌──────────────────────────────────────────┐
│    Application Servers (Stateless)      │
│   User Service | Order Service | ...    │
└──────┬───────────────────────────┬───────┘
       ↓                           ↓
┌─────────────────────┐  ┌─────────────────┐
│  Primary Database   │  │  Cache Layer    │
│  (MySQL, PostgreSQL)│  │  (Redis, Cache) │
└─────────────────────┘  └─────────────────┘
       ↑
       │
   Replication
```

**Scalability Considerations:**

```java
// 1. Stateless Services
// ✓ Can be deployed multiple times
// ✓ Easy to scale horizontally
@RestController
public class OrderController {
    @Autowired  // Don't store user session here
    private OrderService orderService;

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id) {
        // Service stateless - can run on any server
        return orderService.getOrder(id);
    }
}

// 2. Caching Strategy
// Cache at multiple levels:
// - Browser cache (CDN, static assets)
// - Application cache (Redis, Memcached)
// - Database cache (query results)

public class OrderService {
    @Cacheable(value = "orders", key = "#id")
    public Order getOrder(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
}

// 3. Database Optimization
// - Read replicas for scaling reads
// - Sharding for data distribution
// - Denormalization when needed
// - Proper indexing

// 4. Asynchronous Processing
// For slow operations, use message queues
kafkaTemplate.send("order-processing-topic", order);

// 5. Monitoring and Observability
// Track: latency, throughput, errors, resource usage
```

**Common Bottlenecks and Solutions:**

```
Bottleneck: Database becomes slow
Solutions:
├─ Add read replicas
├─ Implement caching
├─ Denormalize data
├─ Shard data by tenant/region
└─ Use NoSQL for specific use cases

Bottleneck: API response slow
Solutions:
├─ Optimize queries (indexes, joins)
├─ Cache responses
├─ Use CDN for static content
├─ Implement pagination
└─ Asynchronous processing

Bottleneck: High memory usage
Solutions:
├─ Optimize data structures
├─ Use object pooling
├─ Implement garbage collection tuning
└─ Consider microservices (split memory)

Bottleneck: CPU maxed out
Solutions:
├─ Multi-threading (if I/O bound)
├─ Optimize algorithms (O(n) → O(log n))
├─ Horizontal scaling
└─ Cache computation results
```

---

## Question 2: Security Best Practices

### Answer:

**Authentication and Authorization:**

```java
// Spring Security configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .antMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            .and()
                .httpBasic();  // or .oauth2Login()

        return http.build();
    }
}

// Never store passwords in plain text
@Service
public class AuthService {
    @Autowired
    private PasswordEncoder passwordEncoder;

    public void registerUser(User user, String password) {
        // Hash password with salt
        user.setPasswordHash(
            passwordEncoder.encode(password)  // BCrypt, Argon2, etc.
        );
        userRepository.save(user);
    }

    public boolean authenticate(String password, String hash) {
        return passwordEncoder.matches(password, hash);
    }
}
```

**Input Validation and Sanitization:**

```java
// ❌ SQL Injection Risk
public User getUserByEmail(String email) {
    String query = "SELECT * FROM users WHERE email = '" + email + "'";
    return executQuery(query);
}

// ✓ Prevent SQL Injection - Use Parameterized Queries
public User getUserByEmail(String email) {
    return userRepository.findByEmail(email);  // JPA handles safely
}

// Validate Input
@RestController
public class UserController {
    @PostMapping("/users")
    public User createUser(@Valid @RequestBody UserDTO dto) {
        // @Valid triggers validation annotations
        return userService.create(dto);
    }
}

@Data
public class UserDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be 8+ characters")
    private String password;

    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Username invalid")
    private String username;
}

// Output Encoding (prevent XSS)
@RestController
public class CommentController {
    @GetMapping("/comments/{id}")
    public CommentDTO getComment(@PathVariable Long id) {
        Comment comment = commentRepository.findById(id).orElse(null);

        // HTML encode to prevent XSS
        return new CommentDTO(
            comment.getId(),
            HtmlUtils.htmlEscape(comment.getText())  // Escape HTML
        );
    }
}
```

**Data Protection:**

```java
// Encrypt Sensitive Data
@Service
public class PaymentService {
    @Autowired
    private EncryptionService encryptionService;

    public void savePaymentDetails(PaymentDetails details) {
        // Encrypt before storing
        details.setCardNumber(
            encryptionService.encrypt(details.getCardNumber())
        );
        paymentRepository.save(details);
    }

    public PaymentDetails getPaymentDetails(Long id) {
        PaymentDetails details = paymentRepository.findById(id).orElse(null);

        // Decrypt before returning
        details.setCardNumber(
            encryptionService.decrypt(details.getCardNumber())
        );
        return details;
    }
}

// Use HTTPS everywhere
// Never log sensitive information
// Implement rate limiting
// Use CORS properly
// Validate file uploads
```

**Common Security Vulnerabilities (OWASP Top 10):**

```
1. Injection (SQL, NoSQL, OS)
2. Broken Authentication
3. Sensitive Data Exposure
4. XML External Entities (XXE)
5. Broken Access Control
6. Security Misconfiguration
7. Cross-Site Scripting (XSS)
8. Insecure Deserialization
9. Using Components with Known Vulnerabilities
10. Insufficient Logging & Monitoring
```

---

## Question 3: Design Patterns for Senior Developers

### Answer:

**Creational Patterns:**

```java
// 1. Singleton Pattern
@Component
public class DatabaseConnection {
    private static DatabaseConnection instance;

    private DatabaseConnection() { }

    public static synchronized DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();
        }
        return instance;
    }
}

// Better: Spring manages singleton
@Component
public class ApplicationConfig {
    @Bean
    public DatabaseConnection databaseConnection() {
        return new DatabaseConnection();
    }
}

// 2. Factory Pattern
public interface NotificationFactory {
    Notification createNotification(String type);
}

public class NotificationFactoryImpl implements NotificationFactory {
    @Override
    public Notification createNotification(String type) {
        switch (type) {
            case "email": return new EmailNotification();
            case "sms": return new SMSNotification();
            case "slack": return new SlackNotification();
            default: throw new IllegalArgumentException("Unknown type");
        }
    }
}

// 3. Builder Pattern
public class PaymentRequest {
    private final String amount;
    private final String currency;
    private final String description;
    private final String customerId;

    private PaymentRequest(Builder builder) {
        this.amount = builder.amount;
        this.currency = builder.currency;
        this.description = builder.description;
        this.customerId = builder.customerId;
    }

    public static class Builder {
        private final String amount;
        private String currency = "USD";
        private String description = "";
        private String customerId = "";

        public Builder(String amount) {
            this.amount = amount;
        }

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public PaymentRequest build() {
            return new PaymentRequest(this);
        }
    }
}

// Usage
PaymentRequest request = new PaymentRequest.Builder("100")
    .currency("EUR")
    .description("Order #123")
    .customerId("cust-456")
    .build();
```

**Structural Patterns:**

```java
// 1. Adapter Pattern (use incompatible interfaces)
public interface ModernPaymentGateway {
    void processPayment(BigDecimal amount);
}

public class LegacyPaymentGateway {
    public void makePayment(double amount) { }
}

public class PaymentAdapter implements ModernPaymentGateway {
    private LegacyPaymentGateway legacy;

    @Override
    public void processPayment(BigDecimal amount) {
        legacy.makePayment(amount.doubleValue());
    }
}

// 2. Decorator Pattern (add behavior dynamically)
public interface DataSource {
    String getData();
}

public class BasicDataSource implements DataSource {
    @Override
    public String getData() {
        return "original data";
    }
}

public class CompressionDecorator implements DataSource {
    private DataSource source;

    public CompressionDecorator(DataSource source) {
        this.source = source;
    }

    @Override
    public String getData() {
        return compress(source.getData());
    }

    private String compress(String data) {
        // Compression logic
        return data;
    }
}

// Usage
DataSource source = new BasicDataSource();
source = new CompressionDecorator(source);
source = new EncryptionDecorator(source);
```

**Behavioral Patterns:**

```java
// 1. Observer Pattern (notify multiple listeners)
public interface EventListener {
    void onEvent(Event event);
}

public class EventPublisher {
    private List<EventListener> listeners = new ArrayList<>();

    public void subscribe(EventListener listener) {
        listeners.add(listener);
    }

    public void publish(Event event) {
        for (EventListener listener : listeners) {
            listener.onEvent(event);
        }
    }
}

// 2. Strategy Pattern (algorithm encapsulation)
public interface PaymentStrategy {
    void pay(double amount);
}

public class CreditCardStrategy implements PaymentStrategy {
    @Override
    public void pay(double amount) {
        System.out.println("Paying " + amount + " by credit card");
    }
}

public class PayPalStrategy implements PaymentStrategy {
    @Override
    public void pay(double amount) {
        System.out.println("Paying " + amount + " by PayPal");
    }
}

public class PaymentProcessor {
    private PaymentStrategy strategy;

    public PaymentProcessor(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public void checkout(double amount) {
        strategy.pay(amount);
    }
}

// Usage
PaymentProcessor processor = new PaymentProcessor(new CreditCardStrategy());
processor.checkout(100);  // Use strategy
```

---

## Question 4: Database Transactions and Consistency

### Answer:

**ACID Properties:**

```
Atomicity: All or nothing
├─ Transfer money: debit + credit both succeed or both fail
├─ Rollback on error
└─ No partial state visible

Consistency: Valid state to valid state
├─ Balance never negative (if constraint set)
├─ Referential integrity maintained
└─ Business rules enforced

Isolation: Concurrent transactions don't interfere
├─ T1 doesn't see uncommitted changes from T2
├─ T1 doesn't see changes while it's running
└─ Configurable isolation levels

Durability: Committed data survives
├─ Survives system failures
├─ Written to persistent storage
└─ Survives power outages
```

**Transaction Isolation Levels:**

```sql
READ UNCOMMITTED (Lowest isolation)
├─ Dirty reads: T1 reads T2's uncommitted data
├─ Repeatable reads: NO
├─ Phantom reads: NO
└─ Use case: Financial reports where accuracy < speed

READ COMMITTED (Default for most DBs)
├─ Dirty reads: NO
├─ Repeatable reads: YES (T2 changes between reads)
├─ Phantom reads: YES (new rows appear)
└─ Use case: Most applications

REPEATABLE READ
├─ Dirty reads: NO
├─ Repeatable reads: NO
├─ Phantom reads: YES
└─ Use case: Inventory management

SERIALIZABLE (Highest isolation)
├─ Dirty reads: NO
├─ Repeatable reads: NO
├─ Phantom reads: NO
├─ But: Very slow due to locking
└─ Use case: Financial transactions
```

**CAP Theorem (Distributed Systems):**

```
Consistency: All nodes see same data
Availability: System always responsive
Partition Tolerance: Works during network failures

You can have at most 2 of 3.

Examples:
├─ CP (Consistency + Partition): HBase, BigTable
│  └─ Sacrifices availability (read-only during partition)
├─ AP (Availability + Partition): DynamoDB, Cassandra
│  └─ Sacrifices consistency (eventually consistent)
└─ CA (Consistency + Availability): Traditional RDBMS
   └─ Sacrifices partition tolerance (single node fails)

For distributed systems: Usually choose AP (available, eventually consistent)
```

**Eventual Consistency Pattern:**

```java
// Distributed transaction using saga pattern

// Service 1: Order Service
@Service
public class OrderService {
    public Order createOrder(Order order) {
        // Save locally
        orderRepository.save(order);

        // Emit event
        kafkaTemplate.send("order-created", convertToJson(order));
        return order;
    }
}

// Service 2: Inventory Service (eventually consistent)
@Service
public class InventoryService {
    @KafkaListener(topics = "order-created", groupId = "inventory")
    public void updateInventory(String message) {
        Order order = parseJson(message);
        try {
            // Process asynchronously
            updateInventoryItems(order);

            // Emit success event
            kafkaTemplate.send("inventory-updated", message);
        } catch (Exception e) {
            // Log the cause, then emit failure event for compensation
            log.error("Inventory update failed for order, emitting failure event", e);
            kafkaTemplate.send("inventory-failed", message);
        }
    }
}

// Service 3: Notification Service (eventually consistent)
@Service
public class NotificationService {
    @KafkaListener(topics = "inventory-updated", groupId = "notifications")
    public void sendConfirmation(String message) {
        Order order = parseJson(message);
        // Send confirmation email
        emailService.sendOrderConfirmation(order);
    }
}

// Eventual Consistency:
// After some time, all services reach consistent state
// But temporarily inconsistent (inventory not yet updated)
```

---

## Question 5: Docker and Containerization Basics

### Answer:

**Dockerfile Example:**

```dockerfile
# Multi-stage build for smaller image
FROM maven:3.8.1-openjdk-17 AS builder

WORKDIR /build
COPY . .
RUN mvn clean package -DskipTests

# Final stage
FROM openjdk:17-slim

WORKDIR /app

# Copy jar from builder
COPY --from=builder /build/target/app.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD java -cp app.jar com.example.HealthCheck || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

# Expose port
EXPOSE 8080
```

**Docker Compose (Multi-container):**

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mydb
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=password
    depends_on:
      - mysql
      - redis
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=mydb
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network

  redis:
    image: redis:7.0-alpine
    networks:
      - app-network

volumes:
  mysql-data:

networks:
  app-network:
    driver: bridge
```

**Kubernetes Basics:**

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

# Service (Load balancer)
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

---

## Question 6: Monitoring, Logging, and Observability

### Answer:

**The Three Pillars of Observability:**

```
1. METRICS (Quantitative)
   ├─ Request latency
   ├─ Throughput
   ├─ Error rate
   ├─ CPU, memory, disk
   └─ Business metrics (transactions, revenue)

2. LOGS (Event records)
   ├─ Error messages
   ├─ Application events
   ├─ Audit trail
   └─ Debugging information

3. TRACES (Request flow)
   ├─ End-to-end request path
   ├─ Service calls
   ├─ Database queries
   └─ Duration at each step
```

**Implementation with Micrometer and Spring Boot:**

```java
// Metrics collection
@Service
public class OrderService {
    @Autowired
    private MeterRegistry meterRegistry;

    public void createOrder(Order order) {
        // Custom metric
        meterRegistry.counter("orders.created").increment();

        try {
            // Business logic
            processOrder(order);

            meterRegistry.timer("order.processing.time").record(() -> {
                // Measures execution time
            });
        } catch (Exception e) {
            meterRegistry.counter("orders.failed").increment();
            throw e;
        }
    }
}

// Logging (Structured logging for easier parsing)
@Service
@Slf4j
public class UserService {
    public User createUser(User user) {
        log.info("Creating user", new Object() {
            public final String email = user.getEmail();
            public final long timestamp = System.currentTimeMillis();
        });

        try {
            User saved = userRepository.save(user);
            log.info("User created successfully", new Object() {
                public final Long userId = saved.getId();
                public final String email = saved.getEmail();
            });
            return saved;
        } catch (Exception e) {
            log.error("Failed to create user", new Object() {
                public final String email = user.getEmail();
                public final String error = e.getMessage();
            }, e);
            throw e;
        }
    }
}
```

**Distributed Tracing with Spring Cloud Sleuth:**

```java
// Automatic trace ID generation
// Every request gets:
// - traceId: Unique per request
// - spanId: Unique per service

// Configuration (pom.xml)
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>

// Logs automatically include traceId and spanId
log.info("Processing order");
// Output: [myapp,b4d5a2e4f2cae8d1,53c5a4de6fb0edd9] Processing order
//          ^service ^traceId     ^spanId

// Distributed tracing across services:
Service A → calls → Service B → calls → Service C
[trace-123]    propagate traceId      [trace-123]
  [span-A]                              [span-C]
           [span-B]

// Can track end-to-end request flow
```

---

## Summary

**Topics for Senior Developer:**

1. **System Design** - Scalability, high availability, CAP theorem
2. **Security** - OWASP, authentication, authorization, encryption
3. **Design Patterns** - When and why to use patterns
4. **Database** - ACID, transactions, consistency
5. **Containerization** - Docker, Kubernetes basics
6. **Observability** - Metrics, logs, traces
7. **DevOps** - CI/CD, infrastructure, monitoring

**Evaluator Assessment:**

- Can they design scalable systems?
- Do they prioritize security?
- Can they explain trade-offs?
- Familiar with modern tools (Docker, K8s)?
- Understand observability importance?
- Experience with distributed systems?

**Red Flags:**

- Only knows monolithic architecture
- Doesn't consider security
- No observability experience
- Can't explain design decisions

**Green Flags:**

- Has built distributed systems
- Security-first mindset
- Understands trade-offs
- Familiar with cloud native tools
- Mentors others on best practices
