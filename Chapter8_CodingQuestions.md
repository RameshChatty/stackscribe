# Chapter 8: Java Coding Questions

## Overview

Real-world coding problems that assess practical Java knowledge, problem-solving approach, and code quality.

---

## Question 1: Implement LRU Cache

### Problem:

Implement a Least Recently Used (LRU) Cache that supports:

- `get(key)` - Get value in O(1)
- `put(key, value)` - Add/update value in O(1)
- `evict()` - Remove least recently used item

### Answer:

**Using LinkedHashMap (Simple):**

```java
class LRUCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> cache;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new LinkedHashMap<K, V>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public V get(K key) {
        return cache.get(key);  // Moves to end (most recently used)
    }

    public void put(K key, V value) {
        cache.put(key, value);  // Moves to end or inserts
    }

    public void display() {
        cache.forEach((k, v) -> System.out.println(k + "=" + v));
    }
}

// Usage
LRUCache<Integer, String> cache = new LRUCache<>(2);
cache.put(1, "one");
cache.put(2, "two");
cache.display();    // 1=one, 2=two

cache.get(1);
cache.display();    // 2=two, 1=one (1 moved to end)

cache.put(3, "three");
cache.display();    // 1=one, 3=three (2 evicted)
```

**Using HashMap + Doubly Linked List (Interview Preferred):**

```java
class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, Node<K, V>> map = new HashMap<>();
    private Node<K, V> head = new Node<>(null, null);  // Dummy head
    private Node<K, V> tail = new Node<>(null, null);  // Dummy tail

    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> prev;
        Node<K, V> next;

        Node(K key, V value) {
            this.key = key;
            this.value = value;
        }
    }

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public V get(K key) {
        if (!map.containsKey(key)) return null;

        Node<K, V> node = map.get(key);
        moveToEnd(node);  // Mark as recently used
        return node.value;
    }

    public void put(K key, V value) {
        if (map.containsKey(key)) {
            // Update existing
            Node<K, V> node = map.get(key);
            node.value = value;
            moveToEnd(node);
        } else {
            // Add new
            if (map.size() >= capacity) {
                // Remove least recently used (after head)
                Node<K, V> lru = head.next;
                remove(lru);
                map.remove(lru.key);
            }

            Node<K, V> node = new Node<>(key, value);
            map.put(key, node);
            addToEnd(node);
        }
    }

    private void moveToEnd(Node<K, V> node) {
        remove(node);
        addToEnd(node);
    }

    private void remove(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void addToEnd(Node<K, V> node) {
        node.next = tail;
        node.prev = tail.prev;
        tail.prev.next = node;
        tail.prev = node;
    }
}

// Test
LRUCache<Integer, String> cache = new LRUCache<>(2);
cache.put(1, "one");
cache.put(2, "two");
System.out.println(cache.get(1));  // "one"
cache.put(3, "three");
System.out.println(cache.get(2));  // null (evicted)
```

**Key Points:**

- O(1) get and put operations
- HashMap for fast lookup
- Doubly linked list for efficient ordering
- Tail (most recent) and Head (least recent)

---

## Question 2: Find Duplicate in Array (1 to N)

### Problem:

Array contains numbers 1 to N, with one number appearing twice. Find it without:

- Extra space (O(1))
- Modifying array

### Answer:

**Solution 1: Floyd's Cycle Detection**

```java
// Problem: Array [1, 3, 4, 2, 2] has duplicate 2
public int findDuplicate(int[] nums) {
    // Treat as linked list: array[i] points to array[array[i]]
    // Duplicate creates cycle

    // Phase 1: Find intersection point in cycle
    int slow = nums[0];
    int fast = nums[0];

    do {
        slow = nums[slow];           // Move 1 step
        fast = nums[nums[fast]];     // Move 2 steps
    } while (slow != fast);

    // Phase 2: Find cycle start
    int pointer1 = nums[0];
    int pointer2 = slow;

    while (pointer1 != pointer2) {
        pointer1 = nums[pointer1];
        pointer2 = nums[pointer2];
    }

    return pointer1;
}

// Time: O(n), Space: O(1)
```

**Solution 2: Math (Sum)**

```java
// Sum of 1 to N = N*(N+1)/2
// Actual sum = expected + duplicate
public int findDuplicate(int[] nums) {
    int n = nums.length - 1;
    int expectedSum = n * (n + 1) / 2;

    int actualSum = 0;
    for (int num : nums) {
        actualSum += num;
    }

    return actualSum - expectedSum;
}

// Time: O(n), Space: O(1)
```

**Solution 3: Bit Manipulation**

```java
public int findDuplicate(int[] nums) {
    int n = nums.length - 1;
    int result = 0;

    // Check each bit
    for (int i = 0; i < 32; i++) {
        int bit = 1 << i;
        int countExpected = 0;
        int countActual = 0;

        // Count bits in expected
        for (int j = 1; j <= n; j++) {
            if ((j & bit) != 0) countExpected++;
        }

        // Count bits in array
        for (int num : nums) {
            if ((num & bit) != 0) countActual++;
        }

        // If actual > expected, this bit is in duplicate
        if (countActual > countExpected) {
            result |= bit;
        }
    }

    return result;
}

// Time: O(32*n) = O(n), Space: O(1)
```

**Example Trace (Floyd's):**

```
Array: [1, 3, 4, 2, 2]
As linked list:
1 → 3 → 2 → 4 → 2 (cycle here)
              ↑   ↓
              └───┘

Slow: 1 → 3 → 2 → 4 → 2
Fast: 1 → 4 → 2 → 2 (meet at 2)
Result: 2
```

---

## Question 3: Group Anagrams

### Problem:

Given array of strings, group anagrams together.

Input: ["eat", "tea", "ate", "bat", "tab", "cat"]
Output: [["eat", "tea", "ate"], ["bat", "tab"], ["cat"]]

### Answer:

**Solution 1: Sort Characters**

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();

    for (String str : strs) {
        // Sort characters: "eat" → "aet"
        char[] chars = str.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);

        map.putIfAbsent(key, new ArrayList<>());
        map.get(key).add(str);
    }

    return new ArrayList<>(map.values());
}

// Time: O(n * k log k) where k = max string length
// Space: O(n * k)
```

**Solution 2: Character Count**

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();

    for (String str : strs) {
        // Count characters: "eat" → "#1a#1e#1t"
        String key = getCharKey(str);

        map.putIfAbsent(key, new ArrayList<>());
        map.get(key).add(str);
    }

    return new ArrayList<>(map.values());
}

private String getCharKey(String str) {
    int[] count = new int[26];
    for (char c : str.toCharArray()) {
        count[c - 'a']++;
    }

    StringBuilder sb = new StringBuilder();
    for (int c : count) {
        sb.append(c).append("#");
    }
    return sb.toString();
}

// Time: O(n * k) where k = max string length
// Space: O(n * k)
```

---

## Question 4: Merge K Sorted Lists

### Problem:

Merge K sorted linked lists into one sorted list.

### Answer:

**Solution: Min Heap**

```java
public class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public ListNode mergeKLists(ListNode[] lists) {
    if (lists == null || lists.length == 0) return null;

    // Min heap (priority queue)
    PriorityQueue<ListNode> minHeap = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );

    // Add first node of each list
    for (ListNode list : lists) {
        if (list != null) {
            minHeap.offer(list);
        }
    }

    ListNode dummy = new ListNode(0);
    ListNode current = dummy;

    // Extract min, add to result, add next node
    while (!minHeap.isEmpty()) {
        ListNode min = minHeap.poll();
        current.next = min;
        current = current.next;

        if (min.next != null) {
            minHeap.offer(min.next);
        }
    }

    return dummy.next;
}

// Time: O(n log k) where n = total nodes, k = number of lists
// Space: O(k) for heap
```

**Alternative: Divide and Conquer**

```java
public ListNode mergeKLists(ListNode[] lists) {
    if (lists == null || lists.length == 0) return null;
    return mergeHelper(lists, 0, lists.length - 1);
}

private ListNode mergeHelper(ListNode[] lists, int left, int right) {
    if (left == right) return lists[left];
    if (left > right) return null;

    int mid = left + (right - left) / 2;
    ListNode l1 = mergeHelper(lists, left, mid);
    ListNode l2 = mergeHelper(lists, mid + 1, right);

    return merge(l1, l2);
}

private ListNode merge(ListNode l1, ListNode l2) {
    if (l1 == null) return l2;
    if (l2 == null) return l1;

    if (l1.val < l2.val) {
        l1.next = merge(l1.next, l2);
        return l1;
    } else {
        l2.next = merge(l1, l2.next);
        return l2;
    }
}

// Time: O(n log k)
// Space: O(log k) for recursion
```

---

## Question 5: Word Search II (Trie + DFS)

### Problem:

Given board and word list, find all words from list that exist in board.

### Answer:

```java
class WordSearchII {
    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        String word;
    }

    public List<String> findWords(char[][] board, String[] words) {
        // Build trie
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (char c : word.toCharArray()) {
                node.children.putIfAbsent(c, new TrieNode());
                node = node.children.get(c);
            }
            node.word = word;
        }

        List<String> result = new ArrayList<>();

        // DFS from each cell
        for (int i = 0; i < board.length; i++) {
            for (int j = 0; j < board[0].length; j++) {
                dfs(board, i, j, root, result);
            }
        }

        return result;
    }

    private void dfs(char[][] board, int i, int j, TrieNode node,
                     List<String> result) {
        if (i < 0 || i >= board.length || j < 0 ||
            j >= board[0].length) return;

        char c = board[i][j];

        // Already visited in this path
        if (c == '#' || !node.children.containsKey(c)) return;

        TrieNode next = node.children.get(c);

        // Word found
        if (next.word != null) {
            result.add(next.word);
            next.word = null;  // Avoid duplicates
        }

        // Mark as visited
        board[i][j] = '#';

        // Explore neighbors
        dfs(board, i+1, j, next, result);
        dfs(board, i-1, j, next, result);
        dfs(board, i, j+1, next, result);
        dfs(board, i, j-1, next, result);

        // Restore
        board[i][j] = c;
    }
}

// Time: O(m*n*4^L) where L = longest word
// Space: O(T) where T = trie size
```

---

## Summary

**Interview Tips:**

1. **Clarify requirements** - Ask questions before coding
2. **Think out loud** - Explain your approach
3. **Start simple** - Get working solution first, optimize later
4. **Test edge cases** - Empty inputs, single element, etc.
5. **Discuss trade-offs** - Time vs space complexity
6. **Clean code** - Readable, maintainable, well-named variables

**Common Mistakes:**

- Not considering edge cases
- Over-complicating solution
- Wrong space/time complexity analysis
- Not asking clarifying questions
- Coding without planning
