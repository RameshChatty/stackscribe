# Chapter 16: Simple System Design Questions

## Overview

This chapter introduces simple system design questions for Java interviews, focusing on architecture decisions, scalability, and trade-offs.

---

## Question 1: How would you design a URL shortener service?

### Answer:

### Requirements:

- Short URL generation
- Redirect to original URL
- High read volume
- Low latency

### Suggested architecture:

- Client → API Gateway → URL Service
- URL Service stores mapping in a database
- Cache layer for frequent URLs
- Load balancer for scale

### Core design choices:

- Use a hash function or base62 encoding.
- Store mapping as `shortCode -> originalUrl`.
- Cache hot URLs in Redis.
- Use a database with indexing on `shortCode`.

### Example flow:

1. Client sends long URL.
2. Service generates a short code.
3. Store mapping in DB.
4. Return short URL.
5. On access, lookup and redirect.

---

## Question 2: What is the difference between vertical and horizontal scaling?

### Answer:

- Vertical scaling: increase resources on a single machine.
- Horizontal scaling: add more machines to share load.

### Preference:

- Horizontal scaling is usually preferred for modern cloud systems.

---

## Question 3: Why do we use caching?

### Answer:

Caching reduces database load and improves response time for frequently requested data.

### Example:

- Cache user profiles
- Cache product catalog
- Cache frequently hit API responses

### Trade-off:

- Caching can return stale data if not managed properly.

---

## Question 4: What is the role of a load balancer?

### Answer:

A load balancer distributes traffic across multiple servers to improve availability and performance.

### Benefits:

- Better fault tolerance
- Improved scalability
- Reduced server overload

---

## Question 5: What are stateless services?

### Answer:

Stateless services do not store session data internally. Each request is handled independently.

### Why this is useful:

- Easy to scale horizontally
- Easy to recover from failure
- Better for container-based deployments

---

## Question 6: How would you design a simple notification system?

### Answer:

### Components:

- Producer service creates notification events
- Message queue decouples producers and consumers
- Worker service sends emails/SMS/push notifications
- Database stores delivery status

### Why queue is useful:

- Prevents immediate dependency on the email/SMS provider
- Improves reliability and throughput

---

## Evaluation Tips

- Ask the candidate to define functional and non-functional requirements first.
- Check whether they can explain trade-offs such as consistency vs availability.
- Look for awareness of caching, load balancers, queues, and database choices.
