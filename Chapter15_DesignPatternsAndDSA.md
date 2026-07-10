# Chapter 15: Design Patterns and DSA Interview Questions

## Overview

This chapter combines common design pattern questions with basic DSA problem-solving questions that are often asked in Java interviews.

---

## Question 1: What is a design pattern?

### Answer:

A design pattern is a reusable solution to a commonly occurring problem in software design.

### Common categories:
- Creational: Singleton, Factory, Builder
- Structural: Adapter, Decorator
- Behavioral: Strategy, Observer, Command

---

## Question 2: What is the Singleton pattern and when is it used?

### Answer:

Singleton ensures that a class has only one instance.

```java
class DatabaseConnection {
    private static final DatabaseConnection INSTANCE = new DatabaseConnection();

    private DatabaseConnection() {}

    public static DatabaseConnection getInstance() {
        return INSTANCE;
    }
}
```

### Common use cases:
- Configuration managers
- Logging services
- Cache providers

---

## Question 3: What is the Factory pattern?

### Answer:

Factory pattern creates objects without exposing the creation logic to the caller.

```java
interface Notification {
    void send(String message);
}

class EmailNotification implements Notification {
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

class NotificationFactory {
    public static Notification create(String type) {
        if (type.equals("email")) return new EmailNotification();
        throw new IllegalArgumentException("Unsupported type");
    }
}
```

---

## Question 4: What is the Builder pattern?

### Answer:

Builder is used when an object has many optional parameters and construction becomes cumbersome.

```java
class User {
    private final String name;
    private final int age;

    private User(Builder builder) {
        this.name = builder.name;
        this.age = builder.age;
    }

    static class Builder {
        private String name;
        private int age;

        Builder name(String name) { this.name = name; return this; }
        Builder age(int age) { this.age = age; return this; }
        User build() { return new User(this); }
    }
}
```

---

## Question 5: Explain binary search.

### Answer:

Binary search works on sorted data and reduces the search range by half each time.

```java
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### Complexity:
- Time: $O(log n)$
- Space: $O(1)$

---

## Question 6: How would you reverse a linked list?

### Answer:

```java
class ListNode {
    int val;
    ListNode next;
}

ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode current = head;

    while (current != null) {
        ListNode next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    return prev;
}
```

---

## Question 7: How do you check for balanced parentheses?

### Answer:

Use a stack.

```java
boolean isBalanced(String s) {
    Stack<Character> stack = new Stack<>();
    for (char ch : s.toCharArray()) {
        if (ch == '(') stack.push(ch);
        else if (ch == ')') {
            if (stack.isEmpty()) return false;
            stack.pop();
        }
    }
    return stack.isEmpty();
}
```

---

## Evaluation Tips

- Check whether the candidate can explain time and space complexity.
- Look for strong understanding of common patterns like stack, queue, hash map, and tree traversal.
