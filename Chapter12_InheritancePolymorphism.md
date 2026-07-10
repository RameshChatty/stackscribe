# Chapter 12: Inheritance, Polymorphism, and Practical OOP Questions

## Overview

This chapter focuses on common interview questions around inheritance, polymorphism, method overriding, and practical OOP design.

---

## Question 1: What is inheritance and why is it used?

### Answer:

Inheritance allows one class to acquire properties and behaviors from another class. It is used to promote code reuse and model real-world relationships.

```java
class Animal {
    void eat() {
        System.out.println("Eating");
    }
}

class Dog extends Animal {
    void bark() {
        System.out.println("Barking");
    }
}
```

### Key points:

- Helps build hierarchical class relationships.
- Promotes reuse.
- Must be used carefully to avoid over-complex inheritance trees.

---

## Question 2: What is method overriding?

### Answer:

Method overriding means a subclass provides a new implementation of a method already defined in its parent class.

```java
class Shape {
    void draw() {
        System.out.println("Drawing shape");
    }
}

class Circle extends Shape {
    @Override
    void draw() {
        System.out.println("Drawing circle");
    }
}
```

### Important notes:

- The method signature must remain the same.
- `@Override` helps catch mistakes.
- Overriding supports runtime polymorphism.

---

## Question 3: What is polymorphism?

### Answer:

Polymorphism means the same action can behave differently depending on the object type.

```java
Shape s1 = new Circle();
s1.draw(); // Calls Circle's draw()
```

### Types of polymorphism:

- Compile-time polymorphism: method overloading
- Runtime polymorphism: method overriding

---

## Question 4: What is the difference between overloading and overriding?

### Answer:

| Feature                   | Overloading                       | Overriding           |
| ------------------------- | --------------------------------- | -------------------- |
| Same class / parent-child | Same class                        | Parent-child         |
| Method signature          | Different                         | Same                 |
| Binding                   | Compile-time                      | Runtime              |
| Purpose                   | Different behavior with same name | Specialized behavior |

```java
class MathUtils {
    int add(int a, int b) { return a + b; }
    double add(double a, double b) { return a + b; }
}
```

---

## Question 5: Why is multiple inheritance not supported in Java?

### Answer:

Java avoids multiple inheritance through classes to prevent the diamond problem and ambiguity.

```java
interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }

class C implements A, B {
    public void m() {
        A.super.m();
    }
}
```

### Key idea:

- Multiple inheritance is supported through interfaces, not through classes.

---

## Question 6: Write a practical example of inheritance and polymorphism.

### Answer:

```java
abstract class Employee {
    abstract void work();
}

class Developer extends Employee {
    @Override
    void work() {
        System.out.println("Writing code");
    }
}

class Tester extends Employee {
    @Override
    void work() {
        System.out.println("Testing application");
    }
}

public class Main {
    public static void main(String[] args) {
        Employee e1 = new Developer();
        Employee e2 = new Tester();

        e1.work();
        e2.work();
    }
}
```

### Why it is good:

- Common contract through the base class.
- Different implementations at runtime.

---

## Evaluation Tips

- Look for clarity around overloading vs overriding.
- Check whether the candidate understands runtime binding.
- Ask them to explain the diamond problem and interface-based solution.
