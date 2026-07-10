# Chapter 13: SOLID Principles and OOP Fundamentals

## Overview

This chapter covers core OOP principles and the SOLID design principles that senior Java developers are expected to understand and apply.

---

## Question 1: What are the four main OOP principles?

### Answer:

The core OOP principles are:

- Encapsulation: hide implementation details and expose only needed behavior.
- Abstraction: expose essential behavior while hiding complexity.
- Inheritance: reuse behavior through parent-child relationships.
- Polymorphism: same interface, different implementation.

```java
class BankAccount {
    private double balance;

    public void deposit(double amount) {
        balance += amount;
    }
}
```

---

## Question 2: What is encapsulation?

### Answer:

Encapsulation protects data by keeping it private and allowing controlled access through methods.

```java
class User {
    private String password;

    public void setPassword(String password) {
        this.password = password;
    }
}
```

### Why it matters:

- Improves maintainability.
- Reduces accidental misuse.
- Makes validation easier.

---

## Question 3: What is abstraction?

### Answer:

Abstraction focuses on what an object does, not how it does it.

```java
interface PaymentProcessor {
    void pay(double amount);
}
```

### Key idea:

- The caller depends on the contract, not the internal implementation.

---

## Question 4: Explain the SOLID principles.

### Answer:

- Single Responsibility Principle (SRP): a class should have one reason to change.
- Open/Closed Principle (OCP): open for extension, closed for modification.
- Liskov Substitution Principle (LSP): subclasses should be substitutable for the base type.
- Interface Segregation Principle (ISP): avoid forcing clients to depend on methods they don’t use.
- Dependency Inversion Principle (DIP): depend on abstractions, not concrete implementations.

### Example:

```java
interface NotificationService {
    void send(String message);
}

class EmailNotification implements NotificationService {
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}
```

---

## Question 5: What is the difference between composition and inheritance?

### Answer:

Inheritance is an “is-a” relationship, while composition is a “has-a” relationship.

```java
class Engine {}
class Car {
    private Engine engine = new Engine();
}
```

### Best practice:

- Prefer composition for flexibility.
- Use inheritance when the relationship is truly hierarchical.

---

## Question 6: How would you explain the Liskov Substitution Principle with an example?

### Answer:

A subclass should work correctly wherever the parent type is expected.

```java
class Bird {
    void fly() { }
}

class Sparrow extends Bird { }

class Ostrich extends Bird {
    @Override
    void fly() {
        throw new UnsupportedOperationException();
    }
}
```

This violates LSP because `Ostrich` cannot fully behave as a `Bird`.

---

## Question 7: Why are SOLID principles important in enterprise Java?

### Answer:

They make software easier to:

- extend
- test
- maintain
- evolve over time

They also reduce coupling and improve code readability.

---

## Evaluation Tips

- Ask for real-world examples of SRP and OCP.
- Check whether the candidate can explain why composition is often better than inheritance.
- Look for practical understanding, not just memorization.
