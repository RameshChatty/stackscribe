# Chapter 7: Spring Boot & Microservices

## Overview

Spring Boot has become the standard for Java development. Senior developers must understand dependency injection, transaction management, REST APIs, and microservices architecture.

---

## Question 1: Spring Boot Fundamentals and Autoconfiguration

### Answer:

**Spring Boot Basics:**

```java
// Main application class with Spring Boot
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// @SpringBootApplication = @Configuration + @ComponentScan + @EnableAutoConfiguration

// Autoconfiguration - Spring Boot automatically configures common beans
// based on classpath dependencies (if pom.xml has spring-boot-starter-web,
// Spring Boot auto-configures DispatcherServlet, ViewResolver, etc.)
```

**Creating REST Endpoints:**

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.update(id, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

**Dependency Injection:**

```java
// Constructor injection (recommended)
@Service
public class UserService {
    private final UserRepository repository;
    private final NotificationService notificationService;

    public UserService(UserRepository repository, NotificationService notificationService) {
        this.repository = repository;
        this.notificationService = notificationService;
    }
}

// Field injection (not recommended - harder to test)
@Service
public class UserService {
    @Autowired
    private UserRepository repository;
}

// Setter injection
@Service
public class UserService {
    private UserRepository repository;

    @Autowired
    public void setRepository(UserRepository repository) {
        this.repository = repository;
    }
}
```

**Application Configuration:**

```yaml
# application.properties
server.port=8080
server.servlet.context-path=/api

spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update

# Logging
logging.level.root=INFO
logging.level.com.mycompany=DEBUG

# Custom properties
app.name=MyApp
app.version=1.0.0
```

**Custom Configuration:**

```java
@Configuration
public class AppConfig {
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    @ConditionalOnProperty(name = "feature.cache", havingValue = "true")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "products");
    }
}
```

---

## Question 2: Transaction Management with @Transactional

### Answer:

**@Transactional Basics:**

```java
@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentService paymentService;

    // Declarative transaction management
    @Transactional
    public Order placeOrder(Order order) {
        // Multiple database operations in single transaction
        Order savedOrder = orderRepository.save(order);

        paymentService.chargeCard(order.getPaymentDetails());

        savedOrder.setStatus(OrderStatus.CONFIRMED);
        return orderRepository.save(savedOrder);

        // If any exception → automatic rollback
        // If successful → automatic commit
    }

    @Transactional(readOnly = true)
    public Order getOrder(Long id) {
        return orderRepository.findById(id).orElse(null);
        // No writes, optimized for reads
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logTransaction(Order order) {
        // Starts NEW transaction (independent of caller's transaction)
        // Commits regardless of caller's rollback
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void criticalOperation() {
        // Highest isolation level, most expensive
        // Prevents all anomalies
    }

    @Transactional(timeout = 30)  // 30 seconds timeout
    public void longRunningOperation() {
        // Transaction rolled back if exceeds 30 seconds
    }
}
```

**Propagation Levels:**

```
REQUIRED (default):
├─ Use existing transaction if available
├─ Create new if not
└─ All operations in same transaction

REQUIRES_NEW:
├─ Always create new transaction
├─ Suspend outer transaction if exists
└─ Commits independently

NESTED:
├─ Create savepoint if transaction exists
├─ Create new transaction if not
└─ Can rollback to savepoint

MANDATORY:
├─ Must run within transaction
└─ Throws exception if not

SUPPORTS:
├─ Use transaction if available
├─ Execute without if not
└─ Non-transactional operation

NOT_SUPPORTED:
├─ Non-transactional execution
├─ Suspend if transaction exists
└─ Good for logging operations
```

**Common Mistakes:**

```java
// ❌ WRONG: @Transactional on public method called internally
@Service
public class UserService {
    @Transactional
    private void updateInternal(User user) {
        // @Transactional IGNORED - private method
    }

    public void updateUser(User user) {
        updateInternal(user);  // No transaction created
    }
}

// ✓ CORRECT: Call through public method or use method.invoke()
@Service
public class UserService {
    @Transactional
    public void updateInternal(User user) {
        // Now @Transactional is active
    }
}

// ❌ WRONG: Catching exception and proceeding
@Service
public class PaymentService {
    @Transactional
    public void processPayment(Payment payment) {
        try {
            chargeCard(payment);
        } catch (Exception e) {
            log.error("Charge failed", e);
            // Exception caught - NO ROLLBACK!
        }
    }
}

// ✓ CORRECT: Let exception propagate or manually rollback
@Service
public class PaymentService {
    @Transactional
    public void processPayment(Payment payment) {
        try {
            chargeCard(payment);
        } catch (Exception e) {
            log.error("Charge failed", e);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            // Or: throw new RuntimeException(e);
        }
    }
}
```

---

## Question 3: Spring Data JPA and Repository Pattern

### Answer:

**Repository Pattern:**

```java
// Entity
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String firstName;
    private String lastName;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

// Repository interface
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA auto-generates implementation

    // Query methods (derived from method name)
    Optional<User> findByEmail(String email);
    List<User> findByFirstName(String firstName);
    List<User> findByFirstNameAndLastName(String firstName, String lastName);
    List<User> findByFirstNameIgnoreCase(String firstName);

    // Custom @Query
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findUserByEmail(@Param("email") String email);

    @Query(value = "SELECT * FROM users WHERE role = ?1", nativeQuery = true)
    List<User> findByRoleNative(String role);

    // Custom update
    @Modifying
    @Query("UPDATE User u SET u.role = :role WHERE u.id = :id")
    void updateRole(@Param("id") Long id, @Param("role") UserRole role);

    // Pagination
    Page<User> findByRole(UserRole role, Pageable pageable);

    // Sorting
    List<User> findAll(Sort sort);
}
```

**Using Repository:**

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User createUser(User user) {
        // Automatic validation, transaction management
        return userRepository.save(user);
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    public Page<User> listUsers(int page, int size) {
        return userRepository.findAll(
            PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
    }

    public List<User> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

**Relationships:**

```java
// One-to-Many
@Entity
public class Author {
    @Id
    @GeneratedValue
    private Long id;

    private String name;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Book> books = new ArrayList<>();
}

@Entity
public class Book {
    @Id
    @GeneratedValue
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "author_id")
    private Author author;
}

// Many-to-Many
@Entity
public class Student {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToMany
    @JoinTable(
        name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new HashSet<>();
}
```

---

## Question 4: Exception Handling and Error Response

### Answer:

**Global Exception Handler:**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException e) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            e.getMessage(),
            System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            e.getMessage(),
            System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal server error",
            System.currentTimeMillis()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

// Error response DTO
@Data
public class ErrorResponse {
    private int status;
    private String message;
    private long timestamp;
}
```

**Custom Exceptions:**

```java
// Custom exception
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(Long id) {
        super("User not found: " + id);
    }
}

// Usage
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}
```

---

## Question 5: Microservices Architecture and Communication

### Answer:

**Microservices Characteristics:**

```
Single Responsibility:
├─ Each service = one business capability
├─ User Service
├─ Order Service
├─ Payment Service
└─ Inventory Service

Independently Deployable:
├─ Deploy without others
├─ Different deployment schedules
└─ Manage versioning independently

Technology Agnostic:
├─ Each service can use different tech
├─ Java, Python, Go, Node.js...
└─ Via common protocols (REST, gRPC, Message Queue)

Scalability:
├─ Scale individual services
├─ Based on demand
└─ Independent resource allocation
```

**Inter-service Communication:**

```java
// 1. Synchronous (REST)
@Service
public class OrderService {
    @Autowired
    private RestTemplate restTemplate;

    public Order createOrder(Order order) {
        // Call payment service synchronously
        PaymentResponse response = restTemplate.postForObject(
            "http://payment-service/api/payments",
            order.getPaymentDetails(),
            PaymentResponse.class
        );

        if (!response.isSuccess()) {
            throw new PaymentFailedException("Payment failed");
        }

        return orderRepository.save(order);
    }
}

// Issues: Tight coupling, cascading failures

// 2. Asynchronous (Message Queue - Kafka, RabbitMQ)
@Service
public class OrderService {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public Order createOrder(Order order) {
        Order saved = orderRepository.save(order);

        // Emit event asynchronously
        kafkaTemplate.send(
            "order-created-events",
            saved.getId().toString(),
            convertToJson(saved)
        );

        return saved;
    }
}

@Service
public class PaymentService {
    @KafkaListener(topics = "order-created-events", groupId = "payment-group")
    public void handleOrderCreated(String message) {
        Order order = parseJson(message);
        processPayment(order);
    }
}

// Benefits: Decoupling, resilience
```

**Service Discovery:**

```yaml
# Eureka Server (service registry)
# Client registers on startup
# Clients query for service location

application.yml for service:
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server:8761/eureka

# Service registration
spring:
  application:
    name: user-service
```

**API Gateway Pattern:**

```
┌─────────────────────────────────────────────────────┐
│            API Gateway                              │
│  (Load balance, Auth, Rate limit, Routing)          │
└──────────────────────────────────────────────────────┘
    ↓          ↓          ↓          ↓
User Service   Order Service   Payment Service  Inventory Service
```

**Configuration:**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
```

---

## Question 6: Handling Distributed Transactions (Saga Pattern)

### Answer:

**Problem: ACID transactions across services don't work (no distributed lock)**

**Solution 1: Orchestration Saga**

```
┌─────────────────┐
│   Order Saga    │  (Orchestrator)
├─────────────────┤
│ 1. Create order │
│ 2. Reserve inv. │
│ 3. Process pay. │
│ 4. Confirm all  │
└─────────────────┘
    ↓   ↓   ↓
Order   Inventory  Payment
Service Service   Service
```

```java
@Service
public class OrderSaga {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private InventoryClient inventoryClient;
    @Autowired
    private PaymentClient paymentClient;

    @Transactional
    public Order createOrder(Order order) {
        try {
            // Step 1: Create order
            Order saved = orderRepository.save(order);

            // Step 2: Reserve inventory
            boolean reserved = inventoryClient.reserve(order.getItems());
            if (!reserved) {
                throw new InventoryUnavailableException();
            }

            // Step 3: Process payment
            PaymentResponse payment = paymentClient.charge(order.getPaymentDetails());
            if (!payment.isSuccess()) {
                // Compensating transaction: release inventory
                inventoryClient.release(order.getItems());
                throw new PaymentFailedException();
            }

            saved.setStatus(OrderStatus.CONFIRMED);
            return orderRepository.save(saved);

        } catch (Exception e) {
            // Compensate/Rollback
            handleCompensation(order);
            throw e;
        }
    }

    private void handleCompensation(Order order) {
        // Undo reserved inventory
        inventoryClient.release(order.getItems());
        // Undo payment (refund)
        paymentClient.refund(order.getPaymentId());
        // Update order status
        order.setStatus(OrderStatus.FAILED);
        orderRepository.save(order);
    }
}
```

**Solution 2: Choreography Saga (Event-driven)**

```
Order Service → emits "OrderCreated"
    ↓
Inventory Service ← listens to "OrderCreated"
    ↓ emits "InventoryReserved"
Payment Service ← listens to "InventoryReserved"
    ↓ emits "PaymentProcessed"
Order Service ← listens to "PaymentProcessed"
    ↓ emits "OrderConfirmed"
```

```java
// Order Service
@Service
public class OrderService {
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order createOrder(Order order) {
        Order saved = orderRepository.save(order);

        // Emit event
        kafkaTemplate.send("order-created", convertToJson(saved));
        return saved;
    }
}

// Inventory Service
@Service
public class InventoryService {
    @KafkaListener(topics = "order-created", groupId = "inventory")
    public void reserveInventory(String message) {
        Order order = parseJson(message);
        try {
            boolean reserved = performReservation(order.getItems());
            kafkaTemplate.send("inventory-reserved", convertToJson(order));
        } catch (Exception e) {
            log.error("Inventory reservation failed for order {}", order.getId(), e);
            kafkaTemplate.send("inventory-reservation-failed", convertToJson(order));
        }
    }
}

// Payment Service
@Service
public class PaymentService {
    @KafkaListener(topics = "inventory-reserved", groupId = "payment")
    public void processPayment(String message) {
        Order order = parseJson(message);
        try {
            processPayment(order.getPaymentDetails());
            kafkaTemplate.send("payment-processed", convertToJson(order));
        } catch (Exception e) {
            log.error("Payment processing failed for order {}", order.getId(), e);
            kafkaTemplate.send("payment-failed", convertToJson(order));
            // Inventory service listens and compensates
        }
    }
}
```

---

## Question 7: Microservices resilience patterns and failure handling

### Answer:

**Why resilience matters:**

- Microservices are distributed systems.
- Partial failures are normal.
- Resilience patterns keep services responsive and prevent cascades.

**Circuit Breaker:**

- Stops calls to a failing downstream service.
- Opens after repeated failures, then transitions to half-open for retries.
- Prevents resource exhaustion and reduces latency spikes.

```java
@Bean
public Customizer<Resilience4JCircuitBreakerFactory> defaultCustomizer() {
    return factory -> factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
        .circuitBreakerConfig(CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .slidingWindowSize(20)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .build())
        .build());
}
```

**Retry Pattern:**

- Retries transient failures before failing fast.
- Combine with exponential backoff to avoid thundering herds.

```java
RetryConfig config = RetryConfig.custom()
    .maxAttempts(3)
    .waitDuration(Duration.ofMillis(500))
    .build();
Retry retry = Retry.of("serviceRetry", config);
```

**Bulkhead Pattern:**

- Limits concurrent access to a service or resource.
- Protects healthy parts of the system from overloaded components.

```java
BulkheadConfig config = BulkheadConfig.custom()
    .maxConcurrentCalls(10)
    .maxWaitDuration(Duration.ofMillis(100))
    .build();
Bulkhead bulkhead = Bulkhead.of("inventoryBulkhead", config);
```

**Rate Limiting:**

- Prevents excessive request rates.
- Useful at the API gateway for client-side limits.

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: api-route
          uri: lb://order-service
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

**Service Mesh and Sidecar:**

- Sidecars handle traffic management, security, and observability outside app code.
- Service mesh offers circuit breaking, retries, telemetry, and mTLS at the platform layer.

**Deployment patterns:**

- Blue-Green: deploy new version to a parallel environment, then switch traffic.
- Canary: route a small percentage of production traffic to a new version first.

**Evaluator checklist:**

- Knows resilience patterns and why each is needed.
- Can explain trade-offs between retry and circuit breaker.
- Understands how bulkhead isolation protects service stability.
- Can describe blue-green and canary deployments.

---

## Summary

**Evaluator Checklist:**

- [ ] Understands Spring Boot autoconfiguration
- [ ] Can design REST APIs
- [ ] Knows @Transactional deeply
- [ ] Familiar with JPA/Repository pattern
- [ ] Understands microservices architecture
- [ ] Can design distributed transactions (Saga)

**Red Flags:**

- Doesn't understand Spring DI
- Can't design REST API properly
- Misuses @Transactional (private methods, exception handling)
- No experience with microservices
- Doesn't handle inter-service failures

**Green Flags:**

- Has debugged Spring/transaction issues
- Understands eventual consistency
- Can design saga patterns
- Knows when to use synchronous vs async
- Familiar with Spring Cloud components
