# Chapter 17: Java Tricky Questions for Confusing Interview Scenarios

## Overview

This chapter covers Java topics that often confuse candidates because the answers are subtle or easy to mix up.

---

## Question 1: What is the difference between call by value and call by reference?

### Answer:

In Java, everything is passed by value. That means a copy of the value is passed to the method.

```java
public class Main {
    public static void changeValue(int x) {
        x = 10;
    }

    public static void main(String[] args) {
        int a = 5;
        changeValue(a);
        System.out.println(a); // 5
    }
}
```

### Important point:

- For primitives, the value is copied.
- For objects, the reference value is copied.

```java
public static void changeObject(Person p) {
    p.name = "Updated";
}

Person person = new Person();
changeObject(person);
System.out.println(person.name); // Updated
```

### Key takeaway:

- Java does not support true call by reference for objects.
- You can modify the object state, but you cannot reassign the caller's reference inside the method.

---

## Question 2: What is cloning in Java?

### Answer:

Cloning means creating a copy of an object.

### Shallow copy:

- Copies the object and its fields by reference.

```java
class Employee implements Cloneable {
    int id;
    Address address;

    @Override
    public Employee clone() throws CloneNotSupportedException {
        return (Employee) super.clone();
    }
}
```

### Deep copy:

- Copies the object and also the referenced objects.

```java
class Employee implements Cloneable {
    int id;
    Address address;

    @Override
    public Employee clone() throws CloneNotSupportedException {
        Employee e = (Employee) super.clone();
        e.address = new Address(this.address.city);
        return e;
    }
}
```

### Key points:

- `clone()` is available from `Object`.
- The class must implement `Cloneable`.
- Deep copy is usually safer for mutable references.

---

## Question 3: What is the difference between `Comparable` and `Comparator`?

### Answer:

### Comparable

- Used to define the natural ordering of an object.
- Implemented inside the class.

```java
class Student implements Comparable<Student> {
    int id;
    String name;

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.id, other.id);
    }
}
```

### Comparator

- Used to define custom ordering externally.
- Implemented separately from the class.

```java
Comparator<Student> byName = (s1, s2) -> s1.name.compareTo(s2.name);
```

### Key difference:

- `Comparable` defines default ordering.
- `Comparator` defines alternate or custom ordering.

---

## Question 4: Why do candidates get confused about `Comparable` vs `Comparator`?

### Answer:

Because both are used for sorting, but they are applied differently:

- `Comparable` is implemented by the class itself.
- `Comparator` is passed separately when sorting.

```java
Collections.sort(list); // uses Comparable
Collections.sort(list, byName); // uses Comparator
```

---

## Question 5: What is a common interview trap around Java pass-by-value?

### Answer:

Candidates often think Java passes objects by reference, but it actually passes the reference value by value.

```java
public static void reassignPerson(Person p) {
    p = new Person();
}

Person p = new Person();
reassignPerson(p);
System.out.println(p == null); // false
```

### Why:

- The method gets a copy of the reference variable.
- Reassigning that local reference does not change the caller's reference.

---

## Question 6: What are the common pitfalls in cloning?

### Answer:

- Shallow copy may share mutable state.
- `clone()` can throw `CloneNotSupportedException`.
- Better alternatives include copy constructors and serialization-based approaches for complex objects.

---

## Evaluation Tips

- Ask the candidate to explain the difference between changing object state and reassigning a reference.
- Check whether they can distinguish natural ordering from custom ordering.
- Look for examples demonstrating shallow vs deep copy.
