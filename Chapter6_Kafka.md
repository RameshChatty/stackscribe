# Chapter 6: Kafka & Event Streaming

## Overview

Kafka is a distributed event streaming platform used for building real-time applications. Senior developers must understand Kafka architecture, producers, consumers, and common patterns.

---

## Question 1: Kafka Architecture and Key Components

### Answer:

**Kafka Architecture:**

```
┌─────────────────────────────────────────────────────┐
│              Kafka Cluster                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Broker 1    Broker 2    Broker 3    Broker N      │
│  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐         │
│  │Topic│    │Topic│    │Topic│    │Topic│         │
│  │ 1-0 │    │ 1-1 │    │ 1-2 │    │ N-P │         │
│  └─────┘    └─────┘    └─────┘    └─────┘         │
│   Part.0     Part.1     Part.2     Part.P          │
│                                                     │
└─────────────────────────────────────────────────────┘
        ↑                               ↑
   Producers                      Consumers
```

**Key Concepts:**

```
Topic: Logical channel for event streaming
├─ Partition 0 ─→ [Event1][Event2][Event3]... (immutable log)
├─ Partition 1 ─→ [Event4][Event5][Event6]...
└─ Partition N ─→ [Event X][Event X][Event X]...

Broker: Server storing topic partitions
├─ Stores events
├─ Replicates for durability
└─ Serves producers and consumers

Consumer Group: Multiple consumers reading same topic
├─ Each partition assigned to ONE consumer
├─ Parallel processing
└─ Offset tracking per partition
```

**Kafka Guarantees:**

```
1. Durability - Events replicated to multiple brokers
2. Ordering - Within a partition, order is guaranteed
3. Fault Tolerance - Survives broker failures via replication
4. Scalability - Partitions allow horizontal scaling
5. Performance - High throughput, low latency
```

---

## Question 2: Kafka Producers - Sending Messages

### Answer:

**Basic Producer:**

```java
import org.apache.kafka.clients.producer.*;

Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

KafkaProducer<String, String> producer = new KafkaProducer<>(props);

// Send message
ProducerRecord<String, String> record =
    new ProducerRecord<>("my-topic", "key1", "value1");

producer.send(record);
producer.close();
```

**Synchronous Send (Blocking):**

```java
try {
    RecordMetadata metadata = producer.send(record).get();
    System.out.println("Partition: " + metadata.partition());
    System.out.println("Offset: " + metadata.offset());
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();  // Restore interrupt status
    throw new RuntimeException("Interrupted while sending record", e);
} catch (ExecutionException e) {
    // Send failed - propagate the underlying cause instead of swallowing it
    throw new RuntimeException("Failed to send record", e.getCause());
}
```

**Asynchronous Send with Callback:**

```java
producer.send(record, new Callback() {
    @Override
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        if (exception != null) {
            System.out.println("Error sending: " + exception);
        } else {
            System.out.println("Sent to partition: " + metadata.partition() +
                             " at offset: " + metadata.offset());
        }
    }
});

// With Lambda
producer.send(record, (metadata, exception) -> {
    if (exception == null) {
        System.out.println("Success: " + metadata.offset());
    } else {
        log.error("Async send failed", exception);
    }
});
```

**Important Producer Configurations:**

```java
Properties props = new Properties();

// Batching for performance
props.put("batch.size", 16384);              // Batch size in bytes
props.put("linger.ms", 10);                  // Wait time for batching

// Reliability
props.put("acks", "all");                    // all = wait for all replicas
// "1" = wait for leader only (default)
// "0" = no acknowledgement

props.put("retries", 3);                     // Retry failed sends
props.put("max.in.flight.requests.per.connection", 5);

// Timeout
props.put("request.timeout.ms", 30000);

// Partitioning
props.put("partitioner.class",
    "org.apache.kafka.clients.producer.internals.DefaultPartitioner");

// Compression
props.put("compression.type", "snappy");     // snappy, lz4, gzip
```

**Partitioning Strategy:**

```java
// Partitioning by key
ProducerRecord<String, String> record1 =
    new ProducerRecord<>("my-topic", "user-123", "event1");
ProducerRecord<String, String> record2 =
    new ProducerRecord<>("my-topic", "user-123", "event2");

// Same key → same partition → ordered delivery for user-123
// If no key → round-robin partition

// Custom partitioner
public class CustomPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                        Object value, byte[] valueBytes,
                        Cluster cluster) {
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();

        if (key == null) {
            return 0;
        }

        String keyStr = (String) key;
        if (keyStr.startsWith("critical-")) {
            return 0;  // Critical messages to partition 0
        }

        return Math.abs(key.hashCode()) % numPartitions;
    }

    @Override
    public void close() { }

    @Override
    public void configure(Map<String, ?> configs) { }
}
```

---

## Question 3: Kafka Consumers - Reading Messages

### Answer:

**Basic Consumer:**

```java
import org.apache.kafka.clients.consumer.*;

Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "my-consumer-group");  // Consumer group ID
props.put("key.deserializer",
    "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer",
    "org.apache.kafka.common.serialization.StringDeserializer");
props.put("auto.offset.reset", "earliest");  // Start from earliest
props.put("enable.auto.commit", true);        // Auto commit offset

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);

// Subscribe to topic(s)
consumer.subscribe(Arrays.asList("my-topic"));

// Polling for messages
while (true) {
    ConsumerRecords<String, String> records =
        consumer.poll(Duration.ofMillis(100));

    for (ConsumerRecord<String, String> record : records) {
        System.out.println("Topic: " + record.topic());
        System.out.println("Partition: " + record.partition());
        System.out.println("Offset: " + record.offset());
        System.out.println("Key: " + record.key());
        System.out.println("Value: " + record.value());
    }
}
```

**Consumer Configuration:**

```java
Properties props = new Properties();

// Auto offset management
props.put("enable.auto.commit", false);      // Manual offset control
props.put("auto.commit.interval.ms", 1000);  // Auto-commit interval

// Session management
props.put("session.timeout.ms", 10000);      // Heartbeat timeout
props.put("heartbeat.interval.ms", 3000);    // Heartbeat interval

// Starting position
props.put("auto.offset.reset", "earliest");  // earliest, latest, none
```

**Manual Offset Management:**

```java
KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));

    try {
        for (ConsumerRecord<String, String> record : records) {
            processRecord(record);
        }
        // Commit only after successful processing
        consumer.commitSync();
    } catch (Exception e) {
        log.error("Failed to process records; offset not committed, will retry on next poll", e);
        // Don't commit - next poll will retry
    }
}

// Async commit with callback
consumer.commitAsync((offsets, exception) -> {
    if (exception != null) {
        System.out.println("Commit error: " + exception);
    }
});
```

**Rebalancing:**

```java
// When consumers join/leave group, partition reassignment happens
class RebalanceListener implements ConsumerRebalanceListener {
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {
        System.out.println("Lost partitions: " + partitions);
        // Clean up, save offsets
    }

    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        System.out.println("Gained partitions: " + partitions);
        // Initialize, seek to saved offset
    }
}

consumer.subscribe(Arrays.asList("my-topic"), new RebalanceListener());
```

**Seeking and Offset Management:**

```java
// Seek to specific offset
consumer.seek(new TopicPartition("my-topic", 0), 100);

// Seek to beginning
consumer.seekToBeginning(Collections.singletonList(
    new TopicPartition("my-topic", 0)));

// Seek to end
consumer.seekToEnd(Collections.singletonList(
    new TopicPartition("my-topic", 0)));

// Get current position
long position = consumer.position(
    new TopicPartition("my-topic", 0));
```

---

## Question 4: Kafka Partitioning and Ordering Guarantees

### Answer:

**Ordering Guarantees:**

```
Within a partition:
├─ Messages are stored in order
├─ Consumer reads in order
└─ Offset increments sequentially

Across partitions:
├─ NO ordering guarantee
├─ Can be read in any order
└─ Messages with different keys may reorder
```

**Use Cases:**

```java
// ✓ Scenario 1: Order matters - user's transactions
// Must use same key for same user
ProducerRecord<String, String> txn1 =
    new ProducerRecord<>("transactions", "user-123", "deposit $100");
ProducerRecord<String, String> txn2 =
    new ProducerRecord<>("transactions", "user-123", "withdraw $50");

// Both go to same partition → ordered delivery
// Same consumer group → one consumer reads both in order

// ✓ Scenario 2: Order doesn't matter - page views
ProducerRecord<String, String> view1 =
    new ProducerRecord<>("page-views", "user-456", "home");
ProducerRecord<String, String> view2 =
    new ProducerRecord<>("page-views", "user-789", "products");

// Can go to different partitions → read in any order
// Multiple consumers can process in parallel
```

**Partition Count Strategy:**

```
Too few partitions:
├─ Single partition bottleneck
├─ Limited parallelism
└─ Poor performance

Too many partitions:
├─ Rebalancing overhead
├─ Memory overhead
└─ Too many files

Sweet spot:
├─ 2-10x number of consumer threads
├─ Monitor partition lag
└─ Adjust as needed
```

---

## Question 5: Kafka Topics, Replication, and Durability

### Answer:

**Topic Configuration:**

```bash
# Create topic with multiple partitions and replication
kafka-topics.sh --create \
  --topic my-topic \
  --partitions 3 \
  --replication-factor 3 \
  --bootstrap-server localhost:9092

# Description
kafka-topics.sh --describe \
  --topic my-topic \
  --bootstrap-server localhost:9092
```

**Replication:**

```
Topic: my-topic
├─ Partition 0
│  ├─ Leader: Broker 1 (handles all read/write)
│  └─ Replicas: Broker 1, Broker 2, Broker 3
├─ Partition 1
│  ├─ Leader: Broker 2
│  └─ Replicas: Broker 2, Broker 3, Broker 1
└─ Partition 2
   ├─ Leader: Broker 3
   └─ Replicas: Broker 3, Broker 1, Broker 2

Replication Factor = 3
├─ If 1 broker fails → others have copy
├─ If 2 brokers fail → 1 copy remains
└─ If all 3 fail → data lost (choose replication factor wisely)
```

**Durability Settings:**

```java
// Acks configuration (producer)
props.put("acks", "0");    // No wait - fast but risky
props.put("acks", "1");    // Wait for leader only (default) - balanced
props.put("acks", "all");  // Wait for all replicas - slow but safe

// Broker settings (server.properties)
log.segment.bytes=1073741824          # When to roll over log
log.retention.hours=168               # How long to keep logs
log.retention.bytes=1073741824        # Max size before deletion
```

**Broker Failover:**

```
Scenario: Broker with partition leader fails

Before failure:
├─ Partition 0 Leader: Broker 1
├─ In-Sync Replicas: Broker 1, Broker 2, Broker 3

Broker 1 crashes:
├─ Kafka detects failure
├─ Broker 2 becomes new leader (was ISR)
├─ Producer fails over automatically
└─ Consumer fails over automatically

After Broker 1 recovery:
├─ Broker 1 joins as follower
├─ Replicates missed messages from leader
└─ After catching up, becomes ISR again
```

---

## Question 6: Kafka Stream Processing and Common Patterns

### Answer:

**At-Least-Once Processing (Common Pattern):**

```java
// Scenario: Process message and commit offset only after success
// Guarantees: Each message processed at least once (possibly duplicates)

while (true) {
    ConsumerRecords<String, String> records =
        consumer.poll(Duration.ofMillis(100));

    for (ConsumerRecord<String, String> record : records) {
        try {
            // Process message (might be called multiple times due to rebalance)
            String result = processOrder(record.value());
            saveToDatabase(result);

            // Update offset in database (along with result)
            saveOffset(record.partition(), record.offset());

            // Commit offset
            consumer.commitSync();
        } catch (Exception e) {
            log.error("Failed to process record at offset {}, will retry next poll",
                      record.offset(), e);
            // Don't commit - will retry
        }
    }
}

// If crash between processing and commit → message reprocessed
// Idempotent processing required (same message twice = same result)
```

**Exactly-Once Processing (Complex but Important):**

```java
// Scenario: Messages processed exactly once (no duplicates, no loss)
// Pattern: Save result and offset together

while (true) {
    ConsumerRecords<String, String> records =
        consumer.poll(Duration.ofMillis(100));

    for (ConsumerRecord<String, String> record : records) {
        // Check if already processed (idempotency key)
        String idempotencyKey = record.topic() + "-" +
                               record.partition() + "-" +
                               record.offset();

        if (isAlreadyProcessed(idempotencyKey)) {
            continue;  // Skip duplicate
        }

        // Process in transaction
        try (Transaction tx = startTransaction()) {
            String result = processOrder(record.value());

            // Save result
            saveToDatabase(result);

            // Save offset and idempotency key in same transaction
            saveOffset(record.partition(), record.offset());
            recordProcessed(idempotencyKey);

            tx.commit();
        }
    }
}
```

**Event Sourcing Pattern:**

```java
// Store all events, derive state from events

public class EventStore {
    public void publishEvent(String aggregateId, String eventType, Map<String, Object> data) {
        ProducerRecord<String, String> record = new ProducerRecord<>(
            "events",           // Topic
            aggregateId,        // Key (ensures ordering per aggregate)
            eventType + ":" + data  // Value
        );
        producer.send(record);
    }
}

// Replay events to build current state
public class EventProcessor {
    public void buildProjection() {
        consumer.subscribe(Collections.singletonList("events"));

        while (true) {
            ConsumerRecords<String, String> records =
                consumer.poll(Duration.ofMillis(100));

            for (ConsumerRecord<String, String> record : records) {
                String aggregateId = record.key();
                String eventData = record.value();

                // Update read model
                updateProjection(aggregateId, eventData);
            }
        }
    }
}
```

**CQRS Pattern (Command Query Responsibility Segregation):**

```
Command Side (Write):
├─ Producer sends commands to Kafka
├─ Handler processes command
├─ Generates event
└─ Emits event to Kafka

Event Topic:
├─ Immutable log of events
└─ Source of truth

Query Side (Read):
├─ Consumer reads events
├─ Updates read model (cache, DB)
└─ Clients query read model (fast)
```

---

## Summary

**Evaluator Checklist:**

- [ ] Understands Kafka architecture
- [ ] Can design producer/consumer workflows
- [ ] Knows partitioning and ordering guarantees
- [ ] Familiar with exactly-once processing
- [ ] Understands replication and durability
- [ ] Can implement event-driven patterns

**Red Flags:**

- Doesn't understand partitioning impact
- No knowledge of offset management
- Assumes ordering across partitions
- Doesn't handle rebalancing
- No experience with failure scenarios

**Green Flags:**

- Can design scalable event architectures
- Understands exactly-once semantics
- Has debugged Kafka issues
- Familiar with CQRS and event sourcing
- Knows performance tuning parameters
