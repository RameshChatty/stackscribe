# Chapter 5: Multi-threading & Concurrency

## Overview

Multi-threading is critical for building scalable systems. This chapter covers thread basics, synchronization, concurrent collections, and high-level concurrency frameworks.

---

## Question 1: Thread Basics - Creating and Starting Threads

### Answer:

Two main ways to create threads:

**1. Extend Thread class:**

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running: " + Thread.currentThread().getName());
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}

// Usage
MyThread thread = new MyThread();
thread.start();  // Starts in new thread
thread.join();   // Wait for completion
```

**2. Implement Runnable (Preferred):**

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Thread running: " + Thread.currentThread().getName());
    }
}

// Usage
Thread thread = new Thread(new MyRunnable());
thread.start();

// Lambda (Java 8+)
new Thread(() -> System.out.println("Running")).start();

// Named thread
Thread thread2 = new Thread(() -> {
    System.out.println("Named thread");
}, "MyThread");
thread2.start();
```

**Thread States:**

```
NEW → RUNNABLE → RUNNING → WAITING/BLOCKED → TERMINATED

NEW: Just created, not started
RUNNABLE: Ready to run, waiting for CPU
RUNNING: Currently executing
WAITING: Waiting for another thread
BLOCKED: Waiting for lock
TERMINATED: Finished
```

**Thread Methods:**

```java
Thread thread = Thread.currentThread();

// Identification
System.out.println(thread.getId());      // Unique ID
System.out.println(thread.getName());    // Thread name
System.out.println(thread.getPriority()); // Priority 1-10

// Control
Thread.sleep(1000);        // Pause current thread
Thread.yield();            // Hint to scheduler
thread.interrupt();        // Interrupt thread
thread.join();             // Wait for completion

// Status
System.out.println(thread.isAlive());    // Still running?
System.out.println(thread.isInterrupted()); // Interrupted?
System.out.println(Thread.interrupted()); // Check & clear flag

// Priority
thread.setPriority(Thread.MAX_PRIORITY); // 10 (higher = more CPU time)
```

---

## Question 2: Synchronization and Thread Safety

### Answer:

**Race Condition Example:**

```java
class Counter {
    private int count = 0;

    // ❌ Race condition - not thread-safe
    public void increment() {
        count++;  // Non-atomic: read, increment, write
    }

    public int getCount() {
        return count;
    }
}

// Test with 10 threads
Counter counter = new Counter();
for (int i = 0; i < 10; i++) {
    new Thread(() -> {
        for (int j = 0; j < 1000; j++) {
            counter.increment();
        }
    }).start();
}

// Expected: 10000, Actual: something less (e.g., 8934)
// Why? Multiple threads increment simultaneously, losing updates
```

**Solution 1: Synchronized Method:**

```java
class SyncCounter {
    private int count = 0;

    // ✓ Thread-safe
    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }
}

// How it works:
// - Only one thread can enter synchronized method at a time
// - Other threads wait for lock
// - Atomic operation on primitive types
```

**Solution 2: Synchronized Block:**

```java
class SyncBlockCounter {
    private int count = 0;
    private final Object lock = new Object();

    public void increment() {
        synchronized (lock) {
            count++;
        }
    }

    public int getCount() {
        synchronized (lock) {
            return count;
        }
    }

    // Only synchronize when necessary (more granular control)
    public void complexOperation() {
        // Non-synchronized code here
        doPreprocessing();

        // Only lock for shared state
        synchronized (lock) {
            count++;
        }

        // Non-synchronized code here
        doPostprocessing();
    }
}
```

**Solution 3: Volatile (for simple flags):**

```java
class FlagExample {
    private volatile boolean running = true;  // Always see latest value

    public void stop() {
        running = false;
    }

    public void work() {
        while (running) {
            doWork();
        }
    }
}

// ✓ Volatile guarantees visibility
// ✗ Does NOT guarantee atomicity
// Use for simple flags, not for counters
```

**Solution 4: Atomic Classes (Java 5+):**

```java
class AtomicCounter {
    private AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // Atomic operation
    }

    public int getCount() {
        return count.get();
    }
}

// Other atomic classes
AtomicBoolean flag = new AtomicBoolean(false);
AtomicLong counter = new AtomicLong(0);
AtomicReference<String> ref = new AtomicReference<>();

// Compare and swap
int oldValue = 5;
int newValue = 10;
boolean success = count.compareAndSet(oldValue, newValue);
```

**Locks (Java 5+):**

```java
import java.util.concurrent.locks.*;

class LockCounter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();  // Unlock in finally to ensure cleanup
        }
    }

    // Try to acquire lock with timeout
    public void incrementWithTimeout() throws InterruptedException {
        if (lock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                count++;
            } finally {
                lock.unlock();
            }
        } else {
            System.out.println("Could not acquire lock");
        }
    }
}

// ReadWriteLock - multiple readers, single writer
ReadWriteLock rwLock = new ReentrantReadWriteLock();

public void readData() {
    rwLock.readLock().lock();
    try {
        // Multiple threads can read simultaneously
    } finally {
        rwLock.readLock().unlock();
    }
}

public void writeData() {
    rwLock.writeLock().lock();
    try {
        // Exclusive write access
    } finally {
        rwLock.writeLock().unlock();
    }
}
```

---

## Question 3: Producer-Consumer Pattern and wait()/notify()

### Answer:

**wait() and notify():**

```java
class WaitNotifyExample {
    private int value = 0;
    private boolean valueSet = false;

    public synchronized void produce(int v) throws InterruptedException {
        while (valueSet) {
            wait();  // Wait for consumer to consume
        }
        value = v;
        valueSet = true;
        notify();  // Wake up waiting consumer
    }

    public synchronized int consume() throws InterruptedException {
        while (!valueSet) {
            wait();  // Wait for producer to produce
        }
        valueSet = false;
        notify();  // Wake up waiting producer
        return value;
    }
}

// Usage
WaitNotifyExample buffer = new WaitNotifyExample();

new Thread(() -> {
    try {
        for (int i = 1; i <= 5; i++) {
            System.out.println("Producing: " + i);
            buffer.produce(i);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}).start();

new Thread(() -> {
    try {
        for (int i = 0; i < 5; i++) {
            int value = buffer.consume();
            System.out.println("Consumed: " + value);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}).start();
```

**Condition Variables (Better wait/notify):**

```java
import java.util.concurrent.locks.*;

class ConditionBuffer<T> {
    private T value;
    private boolean valueSet = false;
    private final Lock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();

    public void produce(T v) throws InterruptedException {
        lock.lock();
        try {
            while (valueSet) {
                notFull.await();  // Wait for slot
            }
            value = v;
            valueSet = true;
            notEmpty.signalAll();  // Signal consumers
        } finally {
            lock.unlock();
        }
    }

    public T consume() throws InterruptedException {
        lock.lock();
        try {
            while (!valueSet) {
                notEmpty.await();  // Wait for value
            }
            T result = value;
            valueSet = false;
            notFull.signalAll();  // Signal producers
            return result;
        } finally {
            lock.unlock();
        }
    }
}
```

**BlockingQueue (Simplest solution):**

```java
import java.util.concurrent.*;

// Built-in blocking queue - handles synchronization
BlockingQueue<Integer> queue = new LinkedBlockingQueue<>(10);

// Producer thread
new Thread(() -> {
    try {
        for (int i = 1; i <= 5; i++) {
            System.out.println("Producing: " + i);
            queue.put(i);  // Blocks if queue full
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}).start();

// Consumer thread
new Thread(() -> {
    try {
        for (int i = 0; i < 5; i++) {
            int value = queue.take();  // Blocks if queue empty
            System.out.println("Consumed: " + value);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}).start();
```

---

## Question 4: ThreadPool and ExecutorService

### Answer:

Creating threads for each task is expensive. Thread pools reuse threads.

```java
import java.util.concurrent.*;

// Different pool types
ExecutorService executor;

// Fixed pool - fixed number of threads
executor = Executors.newFixedThreadPool(5);
// Best for: CPU-bound tasks, known workload

// Cached pool - creates threads as needed, reuses idle
executor = Executors.newCachedThreadPool();
// Best for: I/O-bound tasks, variable workload

// Single thread - single worker thread, sequential execution
executor = Executors.newSingleThreadExecutor();
// Best for: Tasks that must run sequentially

// Virtual thread pool (Java 19+)
executor = Executors.newVirtualThreadPerTaskExecutor();
// Best for: High concurrency, I/O-bound tasks

// Scheduled pool - execute tasks after delay or periodically
ScheduledExecutorService scheduled = Executors.newScheduledThreadPool(2);

// Usage
executor.submit(() -> System.out.println("Task executed"));

// Multiple tasks
for (int i = 0; i < 10; i++) {
    final int taskNum = i;
    executor.submit(() -> {
        System.out.println("Task " + taskNum + " executed");
    });
}

// Wait for all tasks
executor.shutdown();
boolean terminated = executor.awaitTermination(5, TimeUnit.SECONDS);

// Force stop
executor.shutdownNow();  // Interrupt all tasks
```

**Callable vs Runnable:**

```java
// Runnable - no return value, can't throw checked exceptions
Runnable runnable = () -> {
    System.out.println("No return value");
    // throw new IOException();  // ❌ Checked exception not allowed
};

// Callable - returns value, can throw checked exceptions
Callable<String> callable = () -> {
    System.out.println("With return value");
    return "Result";
    // throw new IOException();  // ✓ Allowed
};

// Using Callable with ExecutorService
ExecutorService executor = Executors.newFixedThreadPool(2);

Future<String> future = executor.submit(callable);

// Get result (blocks until available)
try {
    String result = future.get();  // Blocking call
    System.out.println(result);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();  // Restore interrupt status
    throw new RuntimeException("Interrupted while waiting for result", e);
} catch (ExecutionException e) {
    // Unwrap and propagate the real cause of the task failure
    throw new RuntimeException("Task execution failed", e.getCause());
}

// Non-blocking checks
if (future.isDone()) {
    System.out.println("Task completed");
}

boolean cancelled = future.cancel(true);  // Try to cancel

// Get with timeout
try {
    String result = future.get(1, TimeUnit.SECONDS);
} catch (TimeoutException e) {
    System.out.println("Task took too long");
}
```

**Batch Processing:**

```java
// Submit multiple tasks and wait for all
ExecutorService executor = Executors.newFixedThreadPool(5);
List<Future<Integer>> futures = new ArrayList<>();

for (int i = 0; i < 10; i++) {
    final int taskNum = i;
    Future<Integer> future = executor.submit(() -> {
        Thread.sleep(1000);
        return taskNum * taskNum;
    });
    futures.add(future);
}

// Wait for all to complete
executor.shutdown();
executor.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);

// Collect results
List<Integer> results = new ArrayList<>();
for (Future<Integer> future : futures) {
    results.add(future.get());
}

// Using invokeAll (simpler)
List<Callable<Integer>> tasks = new ArrayList<>();
for (int i = 0; i < 10; i++) {
    final int taskNum = i;
    tasks.add(() -> taskNum * taskNum);
}

List<Future<Integer>> allFutures = executor.invokeAll(tasks);
// Wait for all, get results
```

---

## Question 5: Concurrent Collections

### Answer:

Regular collections are not thread-safe. Use concurrent versions for multi-threading.

**ConcurrentHashMap vs Collections.synchronizedMap():**

```java
// ❌ Less efficient: synchronizes entire map
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());

// ✓ Better: segment-based locking
Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();

// Performance comparison
// For 10 threads reading/writing simultaneously:
// synchronizedMap: ~150ms (lock contention)
// ConcurrentHashMap: ~20ms (segment locking)

// ConcurrentHashMap specific operations
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// putIfAbsent - atomic operation
Integer oldValue = map.putIfAbsent("count", 1);

// replace - atomic operation
map.replace("count", 1, 2);  // Replace only if value is 1

// compute operations (Java 8+)
map.compute("count", (k, v) -> v == null ? 0 : v + 1);
map.computeIfPresent("count", (k, v) -> v + 1);
map.computeIfAbsent("count", k -> 0);
```

**Other Concurrent Collections:**

```java
// CopyOnWriteArrayList - Thread-safe list
List<String> list = new CopyOnWriteArrayList<>();
list.add("item1");
list.add("item2");

// Good for: Frequent reads, infrequent writes
// Bad for: Frequent writes (creates copy each time)

// BlockingQueue - Thread-safe queue with blocking operations
BlockingQueue<String> queue = new LinkedBlockingQueue<>(10);
queue.put("item");      // Blocks if full
String item = queue.take();  // Blocks if empty

// ConcurrentLinkedQueue - Thread-safe unbounded queue
Queue<String> concQueue = new ConcurrentLinkedQueue<>();
concQueue.offer("item");
String polled = concQueue.poll();

// CountDownLatch - Wait for N tasks to complete
CountDownLatch latch = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    executor.submit(() -> {
        try {
            doWork();
        } finally {
            latch.countDown();
        }
    });
}
latch.await();  // Wait for all 3 to complete

// CyclicBarrier - Wait for N threads to reach barrier
CyclicBarrier barrier = new CyclicBarrier(5);
for (int i = 0; i < 5; i++) {
    executor.submit(() -> {
        doPhase1();
        barrier.await();  // Wait for all 5 threads
        doPhase2();
    });
}

// Semaphore - Control access with limited permits
Semaphore semaphore = new Semaphore(3);  // 3 permits
// Limits concurrent access to 3 threads
semaphore.acquire();
try {
    accessLimitedResource();
} finally {
    semaphore.release();
}
```

---

## Question 6: Deadlock - Detection and Prevention

### Answer:

Deadlock occurs when two or more threads are waiting for each other, creating infinite wait.

**Deadlock Example:**

```java
class DeadlockExample {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    public void thread1Work() {
        synchronized (lock1) {
            System.out.println("Thread 1: Acquired lock1");
            try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

            synchronized (lock2) {
                System.out.println("Thread 1: Acquired lock2");
            }
        }
    }

    public void thread2Work() {
        synchronized (lock2) {
            System.out.println("Thread 2: Acquired lock2");
            try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

            synchronized (lock1) {
                System.out.println("Thread 2: Acquired lock1");
            }
        }
    }
}

// DEADLOCK!
// Thread 1: lock1 → waiting for lock2
// Thread 2: lock2 → waiting for lock1
// Neither can proceed
```

**Conditions for Deadlock (All must be true):**

1. **Mutual Exclusion** - Resources cannot be shared
2. **Hold and Wait** - Thread holds resource while waiting for another
3. **No Preemption** - Cannot force thread to release resource
4. **Circular Wait** - Thread A waits for B, B waits for A (circular)

**Prevention - Break one condition:**

```java
// ✓ Solution 1: Lock ordering (break circular wait)
class LockOrderExample {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();

    public void thread1Work() {
        synchronized (lock1) {  // Always lock1 first
            synchronized (lock2) {
                // Both methods use same order
            }
        }
    }

    public void thread2Work() {
        synchronized (lock1) {  // Always lock1 first
            synchronized (lock2) {
                // No circular wait possible
            }
        }
    }
}

// ✓ Solution 2: Try lock with timeout (break hold-and-wait)
public void threadWork() {
    lock1.lock();
    try {
        if (lock2.tryLock(1, TimeUnit.SECONDS)) {
            try {
                // Both locks acquired
            } finally {
                lock2.unlock();
            }
        } else {
            // Release lock1 and retry
            System.out.println("Could not acquire lock2, retrying");
        }
    } finally {
        lock1.unlock();
    }
}

// ✓ Solution 3: Single lock (break mutual exclusion)
class SingleLockExample {
    private final Object singleLock = new Object();

    public void thread1Work() {
        synchronized (singleLock) {
            // All threads use same lock
        }
    }

    public void thread2Work() {
        synchronized (singleLock) {
            // No deadlock possible
        }
    }
}
```

**Deadlock Detection:**

```bash
# Generate thread dump
jstack <pid> > dump.txt

# Look for "waiting for monitor" or "blocked"
# Example output showing deadlock:
# Thread "Thread-1" blocked on Object@123 (locked by Thread-2)
# Thread "Thread-2" blocked on Object@456 (locked by Thread-1)

# Programmatically detect
ThreadMXBean bean = ManagementFactory.getThreadMXBean();
long[] deadlockedThreads = bean.findDeadlockedThreads();
if (deadlockedThreads != null && deadlockedThreads.length > 0) {
    System.out.println("Deadlock detected!");
    ThreadInfo[] infos = bean.getThreadInfo(deadlockedThreads);
    for (ThreadInfo info : infos) {
        System.out.println(info);
    }
}
```

---

## Question 7: volatile, happens-before, and Memory Visibility

### Answer:

**The Problem - Visibility:**

```java
class VisibilityProblem {
    private int value = 0;  // Thread A writes, Thread B reads

    public void write() {
        value = 42;  // Write operation
    }

    public void read() {
        System.out.println(value);  // May not see 42 immediately
    }
}

// Without synchronization or volatile:
// - CPU caches can hide writes from other threads
// - Compiler may reorder instructions
// - Thread B may not see Thread A's write
```

**Volatile Guarantee:**

```java
class VolatileExample {
    private volatile int value = 0;  // Visible to all threads

    public void write() {
        value = 42;  // Visible to other threads immediately
    }

    public void read() {
        System.out.println(value);  // Always sees latest write
    }
}

// Volatile guarantees:
// 1. Visibility - writes visible to all threads
// 2. Atomicity only for: read, write
// 3. NO atomicity for: ++ (read-modify-write)

// ❌ Wrong use of volatile
volatile int counter = 0;
counter++;  // NOT atomic - three operations

// ✓ Correct use of volatile
volatile boolean flag = true;  // Simple flag
```

**Happens-Before Relationships:**

```java
// Java Memory Model guarantees happens-before order:

// 1. Program order within a thread
int x = 5;
int y = x + 1;  // y reads x's write (guaranteed)

// 2. Monitor lock
synchronized (lock) {
    x = 5;
}
// x's write happens-before other threads entering lock

// 3. Volatile operations
volatile int flag = 0;
flag = 1;  // Write
int value = flag;  // Read - sees the write

// 4. Thread start
Thread t = new Thread(() -> {
    x = 1;  // Sees main thread's writes before start()
});
t.start();

// 5. Thread termination
// Writes in thread happen-before join() returns
t.join();
System.out.println(x);  // Sees thread's writes
```

**Good Practices:**

```java
// ✓ Safe pattern - volatile + synchronized
class SafeCounter {
    private volatile int count = 0;  // For visibility

    public synchronized void increment() {
        count++;
    }
}

// ✓ Better - Atomic classes (handles both)
class BetterCounter {
    private AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // Atomic + visible
    }
}

// ✓ Best for simple reads/writes
class SimplestCounter {
    private volatile int count = 0;  // Enough for flag-like use
}
```

---

## Summary

**Evaluator Checklist:**

- [ ] Understands race conditions and synchronization
- [ ] Can explain deadlock prevention
- [ ] Familiar with thread pools and ExecutorService
- [ ] Knows when to use concurrent collections
- [ ] Understands volatile and memory visibility
- [ ] Can design producer-consumer patterns

**Red Flags:**

- Doesn't use thread pools
- Over-synchronizes (performance problems)
- Doesn't understand volatile
- Can't prevent deadlocks
- Uses synchronizedList instead of ConcurrentHashMap

**Green Flags:**

- Has debugged threading bugs
- Understands memory visibility
- Knows high-level concurrency tools
- Can optimize synchronization granularity
- Familiar with BlockingQueue patterns
