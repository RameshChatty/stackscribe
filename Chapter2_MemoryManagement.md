# Chapter 2: Memory Management & Garbage Collection

## Overview

This chapter covers JVM memory structure, garbage collection algorithms, memory leaks, and optimization techniques. Critical for senior developers to understand performance implications.

---

## Question 1: Explain JVM Memory Structure

### Answer:

The JVM memory is divided into several regions:

**1. Heap Memory:**

```
┌─────────────────────────────────────────┐
│              HEAP MEMORY                │
├─────────────────────────────────────────┤
│        Young Generation (Eden + Survivor)│ (Faster collection)
│               ~33% of heap              │
├─────────────────────────────────────────┤
│        Old Generation                   │ (Slower collection)
│               ~67% of heap              │
└─────────────────────────────────────────┘
```

```java
// All objects are allocated on heap
String name = "John";           // Object on heap
List<Integer> numbers =
    new ArrayList<>(100);       // Object on heap
numbers.add(42);                // Reference stored, value on heap
```

**2. Stack Memory:**

```
Thread 1 Stack        Thread 2 Stack
┌──────────────┐     ┌──────────────┐
│ Local vars   │     │ Local vars   │
│ References   │     │ References   │
│ Method calls │     │ Method calls │
└──────────────┘     └──────────────┘
```

```java
void someMethod() {
    int age = 25;              // Stack (primitive)
    String name = "John";      // Stack (reference), Heap (object)
    Person person =
        new Person("Jane");    // Stack (reference), Heap (object)
} // Stack space freed when method exits
```

**3. Metaspace (Java 8+):**

```java
// Stores class structures, method data, code, constants
// Previously: PermGen (now removed in Java 8+)
// Dynamically allocated from native memory
```

**Memory Allocation Example:**

```java
public class MemoryExample {
    public static void main(String[] args) {
        int x = 10;                           // Stack
        String str = "Hello";                 // "Hello" in String Pool (Heap)
        List<Integer> list = new ArrayList<>(); // Heap
        list.add(5);                          // Heap

        Person person = new Person();         // Heap
    }
}

class Person {
    String name;      // Instance variable - on heap
    int age;          // Primitive - on heap (as part of object)
}
```

**Memory Layout Visualization:**

```
┌─────────────────────────────────────────┐
│         JVM MEMORY                      │
├─────────────────────────────────────────┤
│ Stack:                                  │
│  x = 10                                 │
│  str (reference) → 0x1000              │
│  list (reference) → 0x2000             │
│  person (reference) → 0x3000           │
├─────────────────────────────────────────┤
│ Heap:                                   │
│  0x1000: "Hello" object                │
│  0x2000: ArrayList object              │
│         [5]                             │
│  0x3000: Person object                 │
│         name (reference) → null        │
│         age = 0                         │
└─────────────────────────────────────────┘
```

---

## Question 2: What is Garbage Collection and how does it work?

### Answer:

Garbage Collection automatically frees memory occupied by objects that are no longer in use.

**Generational GC Concept:**

The JVM assumes:

- Most objects die young (90% in young generation)
- Old objects rarely reference young objects

```
Young Generation (Default: 30% of heap)
├─ Eden Space (80%)           ← New objects allocated here
├─ Survivor Space 0 (10%)     ← Objects that survived one GC
└─ Survivor Space 1 (10%)     ← Objects that survived collections

Old Generation (Default: 70% of heap)
├─ Objects that survived multiple GC cycles
└─ Need full GC (expensive operation)
```

**GC Process - Young Generation (Minor GC):**

```java
public class GCExample {
    public static void main(String[] args) {
        // Phase 1: Allocation in Eden
        Person p1 = new Person("Alice");  // Eden
        Person p2 = new Person("Bob");    // Eden
        Person p3 = new Person("Charlie");// Eden

        // Phase 2: Eden full, Minor GC triggered
        // p1, p2, p3 are referenced → survive to Survivor
        p1 = null;  // p1 now unreferenced

        // Phase 3: Next allocation triggers another Minor GC
        Person p4 = new Person("Dave");   // Eden
        // p1 (unreferenced) → collected
        // p2, p3 → survive again → move to Old Generation

        // If p2 survives more GCs → eventually to Old Generation
    }
}
```

**GC Algorithms:**

1. **Mark and Sweep:**

```
Step 1: Mark - Mark all reachable objects
Step 2: Sweep - Delete unmarked objects
Step 3: Compact - Reorganize remaining objects
```

```java
// Example: Mark and Sweep process
public void demonstrateMarkAndSweep() {
    // Mark phase
    Object root = new Object();
    root.ref1 = new Object();    // Marked as reachable
    root.ref2 = new Object();    // Marked as reachable
    Object orphaned = new Object();  // Not marked
    root.ref1 = null;

    // Sweep phase
    orphaned = null;  // Now eligible for collection

    // Compact phase
    // Memory defragmentation happens
}
```

2. **Copying Collector (Young Generation):**

```
Before:  [LIVE1][DEAD][LIVE2][DEAD][LIVE3]
After:   [LIVE1][LIVE2][LIVE3][EMPTY][EMPTY]
```

3. **Concurrent Mark Sweep (CMS) - Deprecated:**

- Runs concurrently with application
- Reduces pause time but higher CPU usage

4. **G1GC (Recommended for heaps > 4GB):**

```java
// JVM argument: -XX:+UseG1GC
// Divides heap into equal regions
// Prioritizes regions with most garbage
```

**Different GC Collectors:**

```java
// Serial GC - Single threaded (Old Java versions)
// -XX:+UseSerialGC
// Best for: Single-threaded applications

// Parallel GC - Multi-threaded young gen (Default in many versions)
// -XX:+UseParallelGC
// Best for: Throughput-focused applications

// CMS GC - Concurrent collection (Deprecated in Java 9+)
// -XX:+UseConcMarkSweepGC

// G1GC - Garbage First (Default in Java 9+)
// -XX:+UseG1GC
// Best for: Large heaps with predictable pause time

// ZGC - Ultra-low latency (Java 11+)
// -XX:+UseZGC
// Best for: Latency-sensitive applications

// Shenandoah GC - Low pause time (Java 12+)
// -XX:+UseShenandoahGC
```

**GC Tuning Example:**

```bash
# JVM Arguments for GC
java -Xmx4G \           # Max heap 4GB
     -Xms2G \           # Initial heap 2GB
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \  # Target pause time
     -XX:+PrintGCDetails \       # Log GC events
     MyApplication
```

---

## Question 3: What causes memory leaks and how do you detect them?

### Answer:

Memory leak: Objects not referenced but still in memory, preventing garbage collection.

**Common Causes of Memory Leaks:**

**1. Unclosed Resources:**

```java
// ❌ MEMORY LEAK: File never closed
public void readFile() throws IOException {
    FileInputStream fis = new FileInputStream("file.txt");
    byte[] data = new byte[1024];
    fis.read(data);
    // fis never closed → resource leak
}

// ✓ CORRECT: Try-with-resources (Java 7+)
public void readFile() throws IOException {
    try (FileInputStream fis = new FileInputStream("file.txt")) {
        byte[] data = new byte[1024];
        fis.read(data);
    }
    // fis automatically closed
}
```

**2. Static Collections:**

```java
// ❌ MEMORY LEAK: Static list keeps growing
public class Cache {
    private static List<Data> cache = new ArrayList<>();

    public void addToCache(Data data) {
        cache.add(data);  // Never removed → grows indefinitely
    }
}

// ✓ CORRECT: Limited size cache with eviction
public class LimitedCache {
    private final LinkedHashMap<String, Data> cache =
        new LinkedHashMap<String, Data>(100, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > 100;  // Evict when size exceeds 100
            }
        };
}
```

**3. Listeners and Callbacks Not Unregistered:**

```java
// ❌ MEMORY LEAK: Listener never removed
public class EventPublisher {
    private List<EventListener> listeners = new ArrayList<>();

    public void subscribe(EventListener listener) {
        listeners.add(listener);  // Added but never removed
    }
}

// Usage with leak
EventPublisher publisher = new EventPublisher();
publisher.subscribe(event -> System.out.println(event));
// publisher goes out of scope
// listeners still hold reference → memory leak

// ✓ CORRECT: Remove listener
public class EventPublisher {
    private List<EventListener> listeners = new ArrayList<>();

    public void subscribe(EventListener listener) {
        listeners.add(listener);
    }

    public void unsubscribe(EventListener listener) {
        listeners.remove(listener);
    }
}

// Usage
EventPublisher publisher = new EventPublisher();
EventListener listener = event -> System.out.println(event);
publisher.subscribe(listener);
// ... later ...
publisher.unsubscribe(listener);
```

**4. Inner Class References:**

```java
// ❌ MEMORY LEAK: Anonymous inner class holds reference to outer class
public class OuterClass {
    public Runnable createRunnable() {
        return new Runnable() {
            @Override
            public void run() {
                System.out.println("Running");
            }
        };
        // Inner class holds implicit reference to OuterClass
        // If runnable lives longer than outer instance, leak occurs
    }
}

// ✓ CORRECT: Use static inner class or lambda
public class OuterClass {
    public Runnable createRunnable() {
        return () -> System.out.println("Running");
    }
}
```

**5. Thread-related Leaks:**

```java
// ❌ MEMORY LEAK: ThreadLocal not removed
public class ThreadLocalLeak {
    private static final ThreadLocal<Connection> connectionHolder =
        ThreadLocal.withInitial(this::createConnection);

    public Connection getConnection() {
        return connectionHolder.get();
    }
    // If using thread pool, threads are reused
    // ThreadLocal values never cleared → memory leak
}

// ✓ CORRECT: Always remove ThreadLocal
public class ThreadLocalFixed {
    private static final ThreadLocal<Connection> connectionHolder =
        ThreadLocal.withInitial(this::createConnection);

    public Connection getConnection() {
        return connectionHolder.get();
    }

    public void cleanup() {
        connectionHolder.remove();  // Always call
    }
}
```

**Detection Tools and Techniques:**

**1. JProfiler / YourKit:**

```
- Visual memory usage
- Heap dump analysis
- Object retention paths
```

**2. Eclipse MAT (Memory Analyzer Tool):**

```
- Automatic leak detection
- Suspect reports
- Top consumers
```

**3. Command Line Tools:**

```bash
# Capture heap dump
jmap -dump:live,format=b,file=heap.bin <pid>

# Analyze heap dump
jhat -J-Xmx4g heap.bin

# Use MAT offline
```

**4. Java Flight Recorder (Java 11+):**

```bash
java -XX:+UnlockDiagnosticVMOptions \
     -XX:+TraceClassLoading \
     -XX:+DebugNonSafepoints \
     -XX:+FlightRecorder \
     -XX:StartFlightRecording=duration=60s \
     MyApp
```

**5. Programmatic Heap Dump:**

```java
import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;

public class HeapDumpUtil {
    public static void dumpHeap(String fileName) throws IOException {
        MBeanServer mBeanServer = ManagementFactory.getPlatformMBeanServer();
        HotSpotDiagnosticMXBean diag =
            ManagementFactory.newPlatformMXBeanProxy(mBeanServer,
                "com.sun.management:type=HotSpotDiagnostic",
                HotSpotDiagnosticMXBean.class);
        diag.dumpHeap(fileName, true);
    }
}
```

---

## Question 4: What is OutOfMemoryError and its different types?

### Answer:

OutOfMemoryError occurs when JVM cannot allocate sufficient memory.

**Types of OutOfMemoryError:**

**1. Heap Space OOM:**

```java
// ❌ Causes Heap Space OOM
public class HeapOOM {
    public static void main(String[] args) {
        List<byte[]> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]);  // 1MB each
            // Eventually: Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
        }
    }
}

// Solution: Increase heap size or fix the leak
// java -Xmx2G MyApp
```

**2. PermGen Space OOM (Java 7 and earlier):**

```java
// ❌ Causes PermGen OOM
public class PermGenOOM {
    public static void main(String[] args) throws Exception {
        List<Class<?>> classes = new ArrayList<>();
        int count = 0;
        while (true) {
            // Create many classes dynamically
            ClassPool pool = ClassPool.getDefault();
            CtClass cc = pool.makeClass("Class" + count++);
            classes.add(cc.toClass());
            // Eventually: PermGen space exhausted
        }
    }
}

// Solution in Java 8+: No longer exists (replaced by Metaspace)
// But can increase Metaspace: -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=512M
```

**3. Metaspace OOM (Java 8+):**

```java
// ❌ Causes Metaspace OOM
public class MetaspaceOOM {
    public static void main(String[] args) {
        List<Class<?>> classes = new ArrayList<>();
        // Similar to PermGen OOM but from Metaspace
        // Allocated from native memory
    }
}

// Solution: Increase Metaspace
// java -XX:MetaspaceSize=512M -XX:MaxMetaspaceSize=1G MyApp
```

**4. GC Overhead Limit Exceeded:**

```java
// ❌ Causes GC Overhead Limit
public class GCOverheadOOM {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        while (true) {
            for (int i = 0; i < 100000; i++) {
                list.add(i);  // Growing faster than GC can collect
            }
            // Exception: GC overhead limit exceeded
            // GC spends >98% time collecting <2% memory
        }
    }
}

// Solution: Disable check (not recommended)
// java -XX:-UseGCOverheadLimit MyApp
```

**5. Native Memory OOM:**

```java
// ❌ Native memory exhausted (off-heap)
public class NativeMemoryOOM {
    public static void main(String[] args) {
        // Allocating too much direct ByteBuffer
        List<ByteBuffer> buffers = new ArrayList<>();
        while (true) {
            buffers.add(ByteBuffer.allocateDirect(1024 * 1024));
            // Eventually: OutOfMemoryError: Direct buffer memory
        }
    }
}

// Solution: Limit direct memory
// java -XX:MaxDirectMemorySize=512M MyApp
```

**Handling OutOfMemoryError:**

```java
public class OOMHandling {
    public static void main(String[] args) {
        try {
            List<byte[]> list = new ArrayList<>();
            while (true) {
                list.add(new byte[1024 * 1024]);
            }
        } catch (OutOfMemoryError oom) {
            System.err.println("OutOfMemoryError caught!");
            System.err.println("Error: " + oom.getMessage());

            // Get memory info
            Runtime runtime = Runtime.getRuntime();
            System.out.println("Max memory: " + runtime.maxMemory());
            System.out.println("Total memory: " + runtime.totalMemory());
            System.out.println("Free memory: " + runtime.freeMemory());

            // Try to recover
            System.gc();

            // Graceful shutdown
            System.exit(1);
        }
    }
}
```

---

## Question 5: How do you monitor and optimize garbage collection?

### Answer:

**Monitoring GC:**

```bash
# Enable GC logging
java -Xlog:gc*:file=gc.log:time,level,tags \
     -Xlog:safepoint \
     MyApplication

# Legacy GC logging (Java 8)
java -XX:+PrintGCDetails \
     -XX:+PrintGCDateStamps \
     -Xloggc:gc.log \
     MyApplication
```

**Analyzing GC Logs:**

```
[2024-01-15T10:30:45.123+0000][gc] GC(10) Pause Young (Normal) (G1 Evacuation Pause)
Duration: 50ms
Objects: 5000 -> 1000
Memory: 2GB -> 1.5GB
```

**Key Metrics:**

```java
public class GCMetrics {
    public static void main(String[] args) {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

        // Heap memory
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        System.out.println("Heap Init: " + heapUsage.getInit());
        System.out.println("Heap Used: " + heapUsage.getUsed());
        System.out.println("Heap Max: " + heapUsage.getMax());
        System.out.println("Heap Committed: " + heapUsage.getCommitted());

        // GC info
        List<GarbageCollectorMXBean> gcBeans =
            ManagementFactory.getGarbageCollectorMXBeans();
        for (GarbageCollectorMXBean gc : gcBeans) {
            System.out.println("GC: " + gc.getName());
            System.out.println("  Collections: " + gc.getCollectionCount());
            System.out.println("  Time: " + gc.getCollectionTime() + "ms");
        }
    }
}
```

**GC Tuning Best Practices:**

```bash
# 1. Heap sizing strategy
# Young Gen: 1/3 of heap
# Old Gen: 2/3 of heap
java -Xms4G -Xmx4G \          # Use fixed size to avoid full GC
     -XX:NewRatio=2 \          # Old:Young = 2:1
     MyApp

# 2. Tune pause times (G1GC)
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \  # Target 100ms pause
     -XX:InitiatingHeapOccupancyPercent=35 \  # Start concurrent marking at 35%
     MyApp

# 3. For throughput (Parallel GC)
java -XX:+UseParallelGC \
     -XX:ParallelGCThreads=8 \  # Number of GC threads
     -XX:GCTimeRatio=19 \       # 1/20 of time in GC
     MyApp

# 4. For latency (ZGC)
java -XX:+UseZGC \
     -XX:ZCollectionInterval=120 \  # Max pause time
     MyApp
```

**Optimization Techniques:**

```java
// 1. Object pooling (reduces allocation)
public class ObjectPool {
    private Queue<ExpensiveObject> pool = new LinkedList<>();

    public ExpensiveObject acquire() {
        return pool.isEmpty() ?
            new ExpensiveObject() :
            pool.poll();
    }

    public void release(ExpensiveObject obj) {
        obj.reset();
        pool.offer(obj);
    }
}

// 2. Reduce object creation
// ❌ Bad: Creates new lists repeatedly
public void processBatch(List<Integer> numbers) {
    for (Integer num : numbers) {
        List<Integer> temp = new ArrayList<>();  // New list each time
        temp.add(num);
        process(temp);
    }
}

// ✓ Good: Reuse list
public void processBatch(List<Integer> numbers) {
    List<Integer> temp = new ArrayList<>();
    for (Integer num : numbers) {
        temp.clear();
        temp.add(num);
        process(temp);
    }
}

// 3. Minimize heap allocation
public class StackAllocationExample {
    // Precomputed values instead of runtime calculation
    private static final int[] POWERS = new int[10];

    static {
        for (int i = 0; i < 10; i++) {
            POWERS[i] = (int) Math.pow(10, i);
        }
    }
}
```

---

## Summary

**Evaluator Checklist:**

- [ ] Understands heap vs stack allocation
- [ ] Knows different GC algorithms
- [ ] Can identify memory leak patterns
- [ ] Familiar with GC tuning
- [ ] Has debugging experience

**Red Flags:**

- Doesn't understand generational GC
- Confuses heap and stack
- No experience with memory profiling
- Doesn't handle resources properly

**Green Flags:**

- Has debugged real memory leaks
- Can explain pause time trade-offs
- Knows when to tune GC
- Uses try-with-resources pattern
