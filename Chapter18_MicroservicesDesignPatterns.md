# Chapter 18: Microservices Design Patterns Interview Questions

## Overview

This chapter focuses on frequently asked interview questions about microservices design patterns, communication styles, resilience, data ownership, and operational concerns.

---

## Question 1: What are microservices?

### Answer:

Microservices are small, independent services that each implement a specific business capability. They communicate over the network and can be deployed, scaled, and maintained independently.

### Advantages:

- Independent deployment and scaling
- Better team ownership and modularity
- Technology flexibility per service
- Easier fault isolation

### Challenges:

- Distributed system complexity
- Network latency and failures
- Data consistency issues
- More operational overhead

---

## Question 2: When would you choose microservices over a monolith?

### Answer:

Use microservices when the system has:

- Large teams working on different modules
- High scalability requirements
- Independent release cycles
- Different technology needs for different domains

A monolith is usually better for smaller systems with lower complexity and fewer deployment concerns.

---

## Question 3: What is an API Gateway?

### Answer:

An API Gateway is a single entry point for client requests. It handles routing, authentication, rate limiting, SSL termination, load balancing, and sometimes response aggregation.

### Why it is useful:

- Simplifies client integration
- Centralizes cross-cutting concerns
- Protects internal services
- Reduces direct service exposure

---

## Question 4: What is service discovery?

### Answer:

Service discovery helps services find each other dynamically in a distributed environment.

### Common approaches:

- Client-side discovery: the client queries a registry
- Server-side discovery: an intermediary load balancer resolves the service

### Common tools:

- Eureka
- Consul
- Kubernetes service discovery

---

## Question 5: What is the circuit breaker pattern?

### Answer:

A circuit breaker prevents a service from repeatedly calling a failing dependency. After a threshold of failures, the circuit opens and requests fail fast instead of cascading the failure.

### Benefits:

- Prevents system-wide outage
- Improves resilience
- Gives downstream services time to recover

### Common implementations:

- Resilience4j
- Hystrix
- Spring Cloud Circuit Breaker

---

## Question 6: What is the bulkhead pattern?

### Answer:

The bulkhead pattern isolates different parts of a system so one failure does not consume all available resources.

### Example:

- Separate thread pools for critical and non-critical operations
- Isolate expensive calls from important flows

### Goal:

Prevent one failing component from taking down the whole system.

---

## Question 7: What is the Saga pattern?

### Answer:

The Saga pattern is used to manage distributed transactions across multiple services without using a single global transaction.

### Types:

- Orchestration: one service coordinates the workflow
- Choreography: services react to events and coordinate implicitly

### Example:

Order service calls payment service, inventory service, and shipping service. If one step fails, compensating actions are triggered.

---

## Question 8: How do you handle distributed transactions in microservices?

### Answer:

Distributed transactions are difficult, so the common approach is to avoid strong consistency and use eventual consistency.

### Typical options:

- Saga pattern with compensating transactions
- Outbox pattern for reliable event publishing
- Idempotent consumers
- Event-driven architecture

### Interview expectation:

A senior candidate should know that strict ACID transactions across services are usually not practical at scale.

---

## Question 9: What is the difference between synchronous and asynchronous communication?

### Answer:

### Synchronous communication:

- Direct request/response
- Example: REST, gRPC
- Simple and easy to reason about
- Can cause tight coupling and cascading failures

### Asynchronous communication:

- Event-based or message-based
- Example: Kafka, RabbitMQ
- Improves decoupling and scalability
- Introduces eventual consistency

### Rule of thumb:

Use synchronous calls for simple, real-time interactions and asynchronous messaging for high-scale or decoupled workflows.

---

## Question 10: What is CQRS?

### Answer:

CQRS stands for Command Query Responsibility Segregation. It separates read operations from write operations.

### When to use it:

- Read-heavy systems
- Complex domain logic
- Need for optimized query models

### Benefits:

- Better scalability for reads and writes
- Cleaner separation of concerns
- Easier optimization for specific workloads

---

## Question 11: What is the database-per-service pattern?

### Answer:

Each microservice owns its own database. This avoids tight coupling between services and allows independent evolution.

### Benefits:

- Better service autonomy
- Reduced shared schema risk
- Easier independent scaling

### Trade-offs:

- Data duplication
- More complex joins across services
- Eventual consistency becomes necessary

---

## Question 12: How do you ensure reliability in microservices?

### Answer:

Reliability is achieved by combining several practices:

- Retries with backoff
- Timeouts
- Circuit breakers
- Rate limiting
- Health checks
- Graceful degradation
- Proper logging and monitoring

### Important point:

A system should fail gracefully instead of failing completely when one dependency is slow or down.

---

## Question 13: What is idempotency and why is it important?

### Answer:

Idempotency means performing the same operation multiple times produces the same result without causing duplicate side effects.

### Why it matters:

- Network retries can cause duplicate requests
- Message consumers may process the same event more than once
- Critical in payment, order, or inventory systems

### Example:

Use a unique request ID or event ID to detect duplicates.

---

## Question 14: How do you handle observability in microservices?

### Answer:

Observability includes logging, metrics, and tracing.

### Key practices:

- Structured logs with correlation IDs
- Distributed tracing across services
- Metrics for latency, error rate, and throughput
- Alerting for service degradation

### Why it matters:

Microservices are harder to debug because requests span multiple services.

---

## Question 15: What are the common challenges of microservices?

### Answer:

Microservices introduce several challenges:

- Distributed debugging
- Network failures
- Data consistency
- Deployment complexity
- Increased monitoring needs
- Service versioning and backward compatibility

### Senior-level expectation:

A good candidate should not only know the benefits, but also discuss the operational and architectural trade-offs.

---

## Question 16: What is the strangler fig pattern?

### Answer:

The Strangler Fig pattern is used to gradually migrate from a monolith to microservices.

### Approach:

- Incrementally replace parts of the monolith
- Expose new functionality through new services
- Route traffic gradually to the new architecture

### Benefit:

It reduces migration risk and avoids a big-bang rewrite.

---

## Evaluation Tips

- Check whether the candidate understands both benefits and trade-offs.
- Ask how they would design resilience and failure handling.
- Look for awareness of eventual consistency and distributed system principles.
- Favor candidates who can explain real-world patterns like Saga, Circuit Breaker, and API Gateway clearly.
