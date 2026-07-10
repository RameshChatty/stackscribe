# Chapter 14: File Handling and Memory-Efficient I/O

## Overview

This chapter covers practical questions about file handling in Java, especially how to process large files without causing memory overhead.

---

## Question 1: What is the difference between byte streams and character streams?

### Answer:

- Byte streams handle raw binary data.
- Character streams handle text data using character encoding.

```java
InputStream in = new FileInputStream("file.txt");
Reader reader = new FileReader("file.txt");
```

### Use cases:

- Use byte streams for images, videos, and binary files.
- Use character streams for text files.

---

## Question 2: How do you read a large file without loading the whole file into memory?

### Answer:

Use streaming APIs such as `BufferedReader` or files lines as a stream.

```java
try (BufferedReader br = new BufferedReader(new FileReader("large.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
}
```

### Why this is memory efficient:

- Only one line at a time is kept in memory.

---

## Question 3: What is the difference between `FileInputStream` and `BufferedInputStream`?

### Answer:

`BufferedInputStream` adds buffering to reduce the number of disk reads.

```java
try (InputStream in = new BufferedInputStream(new FileInputStream("data.bin"))) {
    byte[] buffer = new byte[1024];
    int bytesRead;
    while ((bytesRead = in.read(buffer)) != -1) {
        // process
    }
}
```

---

## Question 4: How do you read a file using Java NIO?

### Answer:

Java NIO provides `Files` and `Path` APIs for modern file handling.

```java
import java.nio.file.*;

Path path = Paths.get("sample.txt");
String content = Files.readString(path);
System.out.println(content);
```

### Benefits:

- Cleaner API
- Better support for modern I/O operations

---

## Question 5: What is the best way to process very large files line by line?

### Answer:

Use `Files.lines()` with try-with-resources.

```java
try (Stream<String> lines = Files.lines(Path.of("large.txt"))) {
    lines.filter(l -> l.contains("ERROR"))
         .forEach(System.out::println);
}
```

### Important point:

- The stream must be closed after use.

---

## Question 6: What is file locking and when is it useful?

### Answer:

File locking prevents multiple processes from modifying the same file concurrently.

```java
try (FileChannel channel = FileChannel.open(Path.of("data.txt"), StandardOpenOption.WRITE)) {
    FileLock lock = channel.lock();
    // critical section
    lock.release();
}
```

### Use cases:

- Shared log files
- Coordination between multiple processes

---

## Question 7: What are common mistakes in file handling?

### Answer:

- Not closing streams
- Reading entire file into memory unnecessarily
- Not handling encoding properly
- Ignoring exceptions and resource cleanup

### Best practice:

Use try-with-resources wherever possible.

---

## Evaluation Tips

- Ask how the candidate would handle a 5 GB file.
- Check whether they know streaming over full-file loads.
- Look for awareness of `try-with-resources` and NIO APIs.
