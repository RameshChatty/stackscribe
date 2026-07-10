# Chapter 3: Collections Framework

## Overview

The Collections Framework is crucial for Java development. This chapter covers the main interfaces, implementations, and when to use each.

---

## Question 1: Explain the Collections Hierarchy

### Answer:

The Collections Framework is built on these core interfaces:

```
Iterable
├── Collection
│   ├── List
│   │   ├── ArrayList (Resizable array)
│   │   ├── LinkedList (Doubly linked list)
│   │   └── CopyOnWriteArrayList (Thread-safe)
│   ├── Set
│   │   ├── HashSet (Unordered, unique)
│   │   ├── LinkedHashSet (Ordered insertion)
│   │   └── TreeSet (Sorted order)
│   └── Queue
│       ├── PriorityQueue
│       ├── Deque
│       │   ├── ArrayDeque
│       │   └── LinkedList (also a Deque)
│       └── BlockingQueue (Concurrent)
└── Map (Not a Collection, but in framework)
    ├── HashMap (Unordered, fast access)
    ├── LinkedHashMap (Insertion ordered)
    ├── TreeMap (Sorted by key)
    ├── ConcurrentHashMap (Thread-safe)
    └── WeakHashMap (Weak references)
```

**Key Interfaces:**

```java
// Iterable - allows foreach loops
Iterable<String> items = Arrays.asList("A", "B", "C");
for (String item : items) { }  // Uses Iterator internally

// Collection - base collection interface
Collection<String> col = new ArrayList<>();
col.add("item");
col.remove("item");
col.isEmpty();
col.size();

// List - ordered collection (allows duplicates)
List<String> list = new ArrayList<>();
list.add(0, "first");           // Insert at index
String elem = list.get(0);      // Access by index
list.sort(Comparator.naturalOrder());

// Set - unique elements only
Set<String> set = new HashSet<>();
set.add("A");
set.add("A");  // Ignored - duplicate
set.contains("A");

// Queue - FIFO access
Queue<String> queue = new LinkedList<>();
queue.offer("item");    // Add to end
String first = queue.poll();  // Remove from front

// Map - key-value pairs
Map<String, Integer> map = new HashMap<>();
map.put("count", 5);
Integer value = map.get("count");
map.forEach((key, val) -> System.out.println(key + "=" + val));
```

---

## Question 2: ArrayList vs LinkedList - When to use each?

### Answer:

| Operation            | ArrayList      | LinkedList      |
| -------------------- | -------------- | --------------- |
| Get by index         | O(1)           | O(n)            |
| Add/Remove at end    | O(1) amortized | O(1)            |
| Add/Remove at middle | O(n)           | O(n)            |
| Add/Remove at start  | O(n)           | O(1)            |
| Memory overhead      | Low            | High (pointers) |
| Cache friendly       | Yes            | No              |

**Performance Comparison:**

```java
public class ListPerformance {
    public static void main(String[] args) {
        testPerformance(new ArrayList<>());
        testPerformance(new LinkedList<>());
    }

    static void testPerformance(List<Integer> list) {
        long start, end;

        // Add 100k elements at end
        start = System.nanoTime();
        for (int i = 0; i < 100_000; i++) {
            list.add(i);
        }
        end = System.nanoTime();
        System.out.println(list.getClass().getSimpleName() +
                         " add end: " + (end - start) / 1_000_000 + "ms");

        // Get random element
        start = System.nanoTime();
        for (int i = 0; i < 100_000; i++) {
            list.get(i % list.size());
        }
        end = System.nanoTime();
        System.out.println(list.getClass().getSimpleName() +
                         " get: " + (end - start) / 1_000_000 + "ms");

        // Remove from end
        start = System.nanoTime();
        while (!list.isEmpty()) {
            list.remove(list.size() - 1);
        }
        end = System.nanoTime();
        System.out.println(list.getClass().getSimpleName() +
                         " remove end: " + (end - start) / 1_000_000 + "ms");
    }
}

/* Output:
ArrayList add end: 5ms
ArrayList get: 10ms
ArrayList remove end: 2ms

LinkedList add end: 8ms
LinkedList get: 120ms
LinkedList remove end: 95ms
*/
```

**When to use ArrayList:**

```java
// ✓ Frequent random access
public int calculateAverage(List<Integer> numbers) {
    int sum = 0;
    for (int i = 0; i < numbers.size(); i++) {
        sum += numbers.get(i);  // Random access
    }
    return sum / numbers.size();
}

// ✓ Iteration with index
for (int i = 0; i < list.size(); i++) {
    process(list.get(i));
}

// ✓ Most general-purpose use cases
List<String> names = new ArrayList<>();
```

**When to use LinkedList:**

```java
// ✓ Frequent insertion/deletion at ends
Queue<Task> taskQueue = new LinkedList<>();
taskQueue.offer(task);       // Add at end
Task nextTask = taskQueue.poll();  // Remove from front

// ✓ Deque operations
Deque<String> stack = new LinkedList<>();
stack.push("A");
stack.push("B");
stack.pop();  // LIFO

// ✓ Iterator removal during iteration
List<String> list = new LinkedList<>();
for (Iterator<String> it = list.iterator(); it.hasNext();) {
    String item = it.next();
    if (shouldRemove(item)) {
        it.remove();  // Efficient in LinkedList
    }
}
```

**Internal Structure:**

```java
// ArrayList - Dynamic array
class ArrayList<E> {
    private Object[] elementData;  // Backing array
    private int size;

    // When capacity exceeded, grows by 50%
    public void ensureCapacity() {
        if (size == elementData.length) {
            Object[] newArray = new Object[
                (elementData.length * 3) / 2 + 1
            ];
            System.arraycopy(elementData, 0, newArray, 0, size);
            elementData = newArray;
        }
    }
}

// LinkedList - Doubly linked list
class LinkedList<E> {
    private Node<E> first;
    private Node<E> last;
    private int size;

    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;
    }
}
```

---

## Question 3: HashSet vs TreeSet vs LinkedHashSet

### Answer:

| Feature        | HashSet    | TreeSet        | LinkedHashSet                   |
| -------------- | ---------- | -------------- | ------------------------------- |
| Ordering       | None       | Sorted         | Insertion order                 |
| Performance    | O(1)       | O(log n)       | O(1)                            |
| Thread-safe    | No         | No             | No                              |
| Null support   | 1 null     | No nulls       | 1 null                          |
| Implementation | Hash table | Red-Black tree | Hash table + Doubly-linked list |

**Detailed Comparison:**

```java
public class SetComparison {
    public static void main(String[] args) {
        demonstrateHashSet();
        demonstrateTreeSet();
        demonstrateLinkedHashSet();
    }

    static void demonstrateHashSet() {
        Set<String> set = new HashSet<>();
        set.add("Dog");
        set.add("Cat");
        set.add("Apple");
        set.add("Dog");  // Duplicate - ignored

        System.out.println("HashSet: " + set);
        // Output: HashSet: [Cat, Dog, Apple]
        // Order is unpredictable
    }

    static void demonstrateTreeSet() {
        Set<String> set = new TreeSet<>();
        set.add("Dog");
        set.add("Cat");
        set.add("Apple");

        System.out.println("TreeSet: " + set);
        // Output: TreeSet: [Apple, Cat, Dog]
        // Sorted order

        // Range operations
        TreeSet<Integer> numbers = new TreeSet<>(Arrays.asList(1,2,3,4,5));
        System.out.println(numbers.subSet(2, 5));  // [2, 3, 4]
        System.out.println(numbers.headSet(3));    // [1, 2]
        System.out.println(numbers.tailSet(3));    // [3, 4, 5]
    }

    static void demonstrateLinkedHashSet() {
        Set<String> set = new LinkedHashSet<>();
        set.add("Dog");
        set.add("Cat");
        set.add("Apple");
        set.add("Dog");  // Duplicate - ignored

        System.out.println("LinkedHashSet: " + set);
        // Output: LinkedHashSet: [Dog, Cat, Apple]
        // Insertion order maintained
    }
}
```

**Use Cases:**

```java
// HashSet - General uniqueness checking
Set<Integer> visited = new HashSet<>();
for (Integer num : numbers) {
    if (!visited.contains(num)) {
        System.out.println("First time seeing: " + num);
        visited.add(num);
    }
}

// TreeSet - Sorted unique elements
Set<String> topWords = new TreeSet<>();
// Automatically maintains sorted order
for (String word : words) {
    topWords.add(word);
}

// LinkedHashSet - Maintain insertion order with uniqueness
Set<String> recentSearches = new LinkedHashSet<>();
// Like LRU cache that maintains insertion order
```

**Custom Comparator:**

```java
class Employee {
    String name;
    int salary;

    public Employee(String name, int salary) {
        this.name = name;
        this.salary = salary;
    }
}

// TreeSet with custom order
TreeSet<Employee> employees = new TreeSet<>(
    (e1, e2) -> {
        int salaryCompare = Integer.compare(e2.salary, e1.salary);
        return salaryCompare != 0 ? salaryCompare : e1.name.compareTo(e2.name);
    }
);

employees.add(new Employee("Alice", 50000));
employees.add(new Employee("Bob", 60000));
// Sorted by salary (descending), then name
```

---

## Question 4: HashMap vs TreeMap vs ConcurrentHashMap

### Answer:

| Feature     | HashMap | TreeMap       | ConcurrentHashMap   |
| ----------- | ------- | ------------- | ------------------- |
| Ordering    | None    | Sorted by key | None                |
| Performance | O(1)    | O(log n)      | O(1)                |
| Thread-safe | No      | No            | Yes (segment-based) |
| Null keys   | 1       | No            | No                  |
| Null values | Yes     | Yes           | No                  |
| Use case    | General | Sorted data   | Multi-threaded      |

**Detailed Examples:**

```java
// HashMap - Fast, unordered
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 100);
scores.put("Bob", 90);
scores.put("Charlie", 95);

System.out.println(scores);
// Output: {Alice=100, Charlie=95, Bob=90}  (order varies)

// TreeMap - Sorted by key
Map<String, Integer> sortedScores = new TreeMap<>(scores);
System.out.println(sortedScores);
// Output: {Alice=100, Bob=90, Charlie=95}  (alphabetical)

// Range operations
TreeMap<Integer, String> map = new TreeMap<>();
map.put(1, "One");
map.put(3, "Three");
map.put(5, "Five");

System.out.println(map.subMap(2, 5));    // {3=Three}
System.out.println(map.headMap(3));      // {1=One}
System.out.println(map.tailMap(3));      // {3=Three, 5=Five}

// ConcurrentHashMap - Thread-safe
Map<String, Integer> concurrent = new ConcurrentHashMap<>();
concurrent.put("key1", 1);
concurrent.put("key2", 2);

// Safely usable from multiple threads
concurrent.forEach((k, v) -> System.out.println(k + "=" + v));
```

**Performance Comparison:**

```java
public class MapPerformance {
    public static void main(String[] args) {
        performanceTest(new HashMap<>(), "HashMap");
        performanceTest(new TreeMap<>(), "TreeMap");
        performanceTest(new ConcurrentHashMap<>(), "ConcurrentHashMap");
    }

    static void performanceTest(Map<Integer, String> map, String name) {
        long start = System.nanoTime();

        // Add 100k entries
        for (int i = 0; i < 100_000; i++) {
            map.put(i, "Value" + i);
        }

        // Get 100k entries
        for (int i = 0; i < 100_000; i++) {
            map.get(i);
        }

        long end = System.nanoTime();
        System.out.println(name + ": " + (end - start) / 1_000_000 + "ms");
    }
}

/* Output (typical):
HashMap: 15ms
TreeMap: 45ms
ConcurrentHashMap: 25ms
*/
```

**ConcurrentHashMap Thread-safety:**

```java
// ❌ HashMap is not thread-safe
Map<String, Integer> hashMap = new HashMap<>();
new Thread(() -> {
    for (int i = 0; i < 1000; i++) {
        hashMap.put("key" + i, i);
    }
}).start();
new Thread(() -> {
    for (int i = 1000; i < 2000; i++) {
        hashMap.put("key" + i, i);
    }
}).start();
// May cause: ConcurrentModificationException

// ✓ ConcurrentHashMap is thread-safe
Map<String, Integer> concurrent = new ConcurrentHashMap<>();
new Thread(() -> {
    for (int i = 0; i < 1000; i++) {
        concurrent.put("key" + i, i);
    }
}).start();
new Thread(() -> {
    for (int i = 1000; i < 2000; i++) {
        concurrent.put("key" + i, i);
    }
}).start();
// No exceptions - thread-safe
```

**Internal Structure:**

```java
// ConcurrentHashMap uses segment-based locking
// Divides the map into multiple segments
// Each segment can be locked independently
// Default: 16 segments (allows 16 concurrent writes)

ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
// Segment 0: handles keys with hash % 16 == 0
// Segment 1: handles keys with hash % 16 == 1
// ...
// Segment 15: handles keys with hash % 16 == 15

// Multiple threads can write to different segments simultaneously
```

---

## Question 5: Explain iterating over collections and ConcurrentModificationException

### Answer:

```java
// ❌ ConcurrentModificationException
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D"));

for (String item : list) {
    if (item.equals("B")) {
        list.remove(item);  // ❌ Throws ConcurrentModificationException
    }
}

// Why? The iterator maintains an expectedModCount
// When collection is modified directly, ConcurrentModificationException is thrown
```

**Solutions:**

```java
// Solution 1: Use Iterator.remove()
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D"));

Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String item = it.next();
    if (item.equals("B")) {
        it.remove();  // ✓ Safe
    }
}

// Solution 2: Create a copy
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D"));
List<String> toRemove = new ArrayList<>();

for (String item : list) {
    if (item.equals("B")) {
        toRemove.add(item);
    }
}
list.removeAll(toRemove);  // ✓ Remove after iteration

// Solution 3: Stream API (Java 8+)
List<String> result = list.stream()
    .filter(item -> !item.equals("B"))
    .collect(Collectors.toList());

// Solution 4: Use CopyOnWriteArrayList
List<String> list = new CopyOnWriteArrayList<>(
    Arrays.asList("A", "B", "C", "D")
);

for (String item : list) {
    if (item.equals("B")) {
        list.remove(item);  // ✓ Safe (creates copy internally)
    }
}
```

**Internal Implementation Detail:**

```java
// How ArrayList tracks modification
class ArrayList<E> {
    protected transient int modCount = 0;

    private class Itr implements Iterator<E> {
        int expectedModCount = modCount;

        public E next() {
            if (modCount != expectedModCount) {
                throw new ConcurrentModificationException();
            }
            // ...
        }
    }

    public void add(E e) {
        modCount++;
        // add logic
    }

    public boolean remove(Object o) {
        modCount++;
        // remove logic
    }
}
```

---

## Question 6: Collections utility methods and best practices

### Answer:

**Useful Utility Methods:**

```java
// Sort
List<Integer> numbers = Arrays.asList(3, 1, 4, 1, 5);
Collections.sort(numbers);  // [1, 1, 3, 4, 5]

// Reverse
Collections.reverse(numbers);  // [5, 4, 3, 1, 1]

// Shuffle
Collections.shuffle(numbers);  // Random order

// Search (binary search on sorted list)
int index = Collections.binarySearch(numbers, 3);

// Synchronization wrappers
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
Set<String> syncSet = Collections.synchronizedSet(new HashSet<>());

// Unmodifiable views
List<String> immutable = Collections.unmodifiableList(list);
Set<String> immutableSet = Collections.unmodifiableSet(set);

// Empty collections
List<String> empty = Collections.emptyList();
Set<Integer> emptySet = Collections.emptySet();
Map<String, Integer> emptyMap = Collections.emptyMap();

// Frequency
int count = Collections.frequency(list, "A");

// Copy
List<String> dest = new ArrayList<>(list.size());
Collections.copy(dest, list);
```

**Java 8+ Stream Operations:**

```java
// Sorting with Stream
List<Integer> sorted = numbers.stream()
    .sorted()
    .collect(Collectors.toList());

// Filtering
List<Integer> evens = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

// Mapping
List<String> strings = numbers.stream()
    .map(String::valueOf)
    .collect(Collectors.toList());

// Grouping
Map<Integer, List<String>> grouped = strings.stream()
    .collect(Collectors.groupingBy(String::length));
```

---

## Summary

**Evaluator Checklist:**

- [ ] Understands Collection hierarchy
- [ ] Knows performance characteristics of each collection
- [ ] Can explain when to use each type
- [ ] Knows how to handle ConcurrentModificationException
- [ ] Familiar with concurrent collections

**Red Flags:**

- Uses ArrayList for frequent insertions at start
- Doesn't know about ConcurrentHashMap
- Can't explain Big O complexity
- Doesn't handle iteration safety

**Green Flags:**

- Can benchmark different implementations
- Knows when to use specialized collections
- Understands concurrent collections
- Uses Streams API appropriately
