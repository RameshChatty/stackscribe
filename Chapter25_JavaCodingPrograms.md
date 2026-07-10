# Chapter 25: Java Coding Programs — Arrays & Strings

## Overview

A collection of classic Java coding programs frequently asked in interviews and used for practice, split into two sections:

- **Section A — Array Programs**
- **Section B — String Problems**

Each program includes runnable Java code and a short note. Snippets assume `import java.util.*;` (and `java.util.stream.*` / `java.io.*` where used).

---

# Section A — Array Programs

## A1: Copy all elements of one array into another array

```java
int[] source = {1, 2, 3, 4, 5};
int[] dest = new int[source.length];

// Option 1: manual loop
for (int i = 0; i < source.length; i++) dest[i] = source[i];

// Option 2: built-ins
int[] copy1 = Arrays.copyOf(source, source.length);
int[] copy2 = source.clone();
System.arraycopy(source, 0, dest, 0, source.length);
```

Note: `Arrays.copyOf`, `clone()`, and `System.arraycopy` all create shallow copies (fine for primitives).

---

## A2: Find the frequency of each element in the array

```java
int[] arr = {1, 2, 2, 3, 3, 3, 4};
Map<Integer, Integer> freq = new HashMap<>();
for (int n : arr) freq.merge(n, 1, Integer::sum);
System.out.println(freq); // {1=1, 2=2, 3=3, 4=1}
```

Note: `merge(key, 1, Integer::sum)` increments the count, inserting 1 if absent. `O(n)` time.

---

## A3: Left rotate the elements of an array

```java
static void leftRotate(int[] arr, int k) {
    int n = arr.length;
    k %= n;
    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}
static void reverse(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}
// {1,2,3,4,5} left-rotate by 2 -> {3,4,5,1,2}
```

Note: the reversal algorithm rotates in `O(n)` time and `O(1)` space.

---

## A4: Print the duplicate elements of an array

```java
int[] arr = {1, 2, 2, 3, 4, 4, 5};
Set<Integer> seen = new HashSet<>();
Set<Integer> dups = new LinkedHashSet<>();
for (int n : arr) if (!seen.add(n)) dups.add(n);
System.out.println(dups); // [2, 4]
```

Note: `seen.add(n)` returns `false` when `n` is already present → it's a duplicate.

---

## A5: Print the elements of an array

```java
int[] arr = {10, 20, 30};
for (int n : arr) System.out.print(n + " ");
System.out.println(Arrays.toString(arr)); // [10, 20, 30]
```

---

## A6: Print the elements of an array in reverse order

```java
int[] arr = {1, 2, 3, 4, 5};
for (int i = arr.length - 1; i >= 0; i--) System.out.print(arr[i] + " ");
// 5 4 3 2 1
```

---

## A7: Print the elements present on even positions

```java
int[] arr = {10, 20, 30, 40, 50};
for (int i = 0; i < arr.length; i += 2)   // index 0, 2, 4 (even indices)
    System.out.print(arr[i] + " ");        // 10 30 50
```

Note: "even position" here means even index (0-based). If positions are 1-based, iterate `i = 1` step 2.

---

## A8: Print the elements present on odd positions

```java
int[] arr = {10, 20, 30, 40, 50};
for (int i = 1; i < arr.length; i += 2)   // index 1, 3 (odd indices)
    System.out.print(arr[i] + " ");        // 20 40
```

---

## A9: Print the largest element in an array

```java
int[] arr = {3, 7, 2, 9, 4};
int max = arr[0];
for (int n : arr) if (n > max) max = n;
System.out.println(max); // 9
// or: Arrays.stream(arr).max().getAsInt();
```

---

## A10: Print the smallest element in an array

```java
int[] arr = {3, 7, 2, 9, 4};
int min = arr[0];
for (int n : arr) if (n < min) min = n;
System.out.println(min); // 2
// or: Arrays.stream(arr).min().getAsInt();
```

---

## A11: Print the number of elements present in an array

```java
int[] arr = {1, 2, 3, 4};
System.out.println(arr.length); // 4
```

---

## A12: Print the sum of all the items of the array

```java
int[] arr = {1, 2, 3, 4, 5};
int sum = 0;
for (int n : arr) sum += n;
System.out.println(sum); // 15
// or: Arrays.stream(arr).sum();
```

---

## A13: Right rotate the elements of an array

```java
static void rightRotate(int[] arr, int k) {
    int n = arr.length;
    k %= n;
    reverse(arr, 0, n - 1);
    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
}
// reverse() as defined in A3
// {1,2,3,4,5} right-rotate by 2 -> {4,5,1,2,3}
```

---

## A14: Sort the elements of an array in ascending order

```java
int[] arr = {5, 2, 8, 1, 9};
Arrays.sort(arr);
System.out.println(Arrays.toString(arr)); // [1, 2, 5, 8, 9]
```

---

## A15: Sort the elements of an array in descending order

```java
Integer[] arr = {5, 2, 8, 1, 9};              // boxed, so a Comparator works
Arrays.sort(arr, Collections.reverseOrder());
System.out.println(Arrays.toString(arr));     // [9, 8, 5, 2, 1]

// For int[]: sort ascending then reverse in place.
```

Note: primitive `int[]` can't use a `Comparator`; box to `Integer[]` or sort ascending and reverse.

---

## A16: Find the 3rd largest number in an array

```java
int[] arr = {10, 4, 3, 50, 23, 90};
int[] top = {Integer.MIN_VALUE, Integer.MIN_VALUE, Integer.MIN_VALUE}; // 1st,2nd,3rd
for (int n : arr) {
    if (n > top[0]) { top[2] = top[1]; top[1] = top[0]; top[0] = n; }
    else if (n > top[1] && n != top[0]) { top[2] = top[1]; top[1] = n; }
    else if (n > top[2] && n != top[1] && n != top[0]) { top[2] = n; }
}
System.out.println(top[2]); // 23  (distinct 3rd largest)
```

Note: single pass, `O(n)`, tracks the top three distinct values.

---

## A17: Find the 2nd largest number in an array

```java
int[] arr = {10, 4, 3, 50, 23, 90};
int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
for (int n : arr) {
    if (n > first) { second = first; first = n; }
    else if (n > second && n != first) { second = n; }
}
System.out.println(second); // 50
```

---

## A18: Find the largest number in an array

```java
int[] arr = {10, 4, 3, 50, 23, 90};
int max = Arrays.stream(arr).max().getAsInt();
System.out.println(max); // 90
```

---

## A19: Find the 2nd smallest number in an array

```java
int[] arr = {10, 4, 3, 50, 23, 90};
int first = Integer.MAX_VALUE, second = Integer.MAX_VALUE;
for (int n : arr) {
    if (n < first) { second = first; first = n; }
    else if (n < second && n != first) { second = n; }
}
System.out.println(second); // 4
```

---

## A20: Find the smallest number in an array

```java
int[] arr = {10, 4, 3, 50, 23, 90};
int min = Arrays.stream(arr).min().getAsInt();
System.out.println(min); // 3
```

---

## A21: Remove duplicate elements in an array

```java
int[] arr = {1, 2, 2, 3, 4, 4, 5};
int[] unique = Arrays.stream(arr).distinct().toArray();
System.out.println(Arrays.toString(unique)); // [1, 2, 3, 4, 5]

// Preserving via LinkedHashSet (keeps insertion order):
Set<Integer> set = new LinkedHashSet<>();
for (int n : arr) set.add(n);
```

---

## A22: Print odd and even numbers from an array

```java
int[] arr = {1, 2, 3, 4, 5, 6};
System.out.print("Even: ");
for (int n : arr) if (n % 2 == 0) System.out.print(n + " "); // 2 4 6
System.out.print("\nOdd: ");
for (int n : arr) if (n % 2 != 0) System.out.print(n + " "); // 1 3 5
```

---

## A23: How to sort an array in Java (summary)

```java
int[] a = {3, 1, 2};
Arrays.sort(a);                                  // ascending primitives

Integer[] b = {3, 1, 2};
Arrays.sort(b, Comparator.reverseOrder());       // descending (boxed)

int[] c = {3, 1, 2};
Arrays.parallelSort(c);                          // parallel sort (large arrays)

// Objects by a field:
Arrays.sort(people, Comparator.comparing(Person::getAge));
```

Note: `Arrays.sort` uses dual-pivot quicksort for primitives and a stable Timsort for objects.

---

# Section B — String Problems

## B1: Count the total number of characters in a string

```java
String s = "Hello World";
System.out.println(s.length());                       // 11 (includes spaces)
System.out.println(s.replace(" ", "").length());      // 10 (excluding spaces)
```

---

## B2: Count the total number of punctuation characters in a String

```java
String s = "Hello, World! How's it going?";
int count = 0;
for (char c : s.toCharArray())
    if (!Character.isLetterOrDigit(c) && !Character.isWhitespace(c)) count++;
System.out.println(count); // 4  ( , ! ' ? )
```

---

## B3: Count the total number of vowels and consonants in a string

```java
String s = "Java Programming";
int vowels = 0, consonants = 0;
for (char c : s.toLowerCase().toCharArray()) {
    if (c >= 'a' && c <= 'z') {
        if ("aeiou".indexOf(c) >= 0) vowels++;
        else consonants++;
    }
}
System.out.println("Vowels: " + vowels + ", Consonants: " + consonants);
```

---

## B4: Determine whether two strings are anagrams

```java
static boolean isAnagram(String a, String b) {
    char[] x = a.replaceAll("\\s", "").toLowerCase().toCharArray();
    char[] y = b.replaceAll("\\s", "").toLowerCase().toCharArray();
    if (x.length != y.length) return false;
    Arrays.sort(x); Arrays.sort(y);
    return Arrays.equals(x, y);
}
// isAnagram("listen", "silent") -> true
```

Note: sort-and-compare is `O(n log n)`; a frequency-count array is `O(n)`.

---

## B5: Divide a string into 'N' equal parts

```java
static List<String> divide(String s, int n) {
    if (s.length() % n != 0) throw new IllegalArgumentException("Not divisible into " + n + " equal parts");
    int size = s.length() / n;
    List<String> parts = new ArrayList<>();
    for (int i = 0; i < s.length(); i += size) parts.add(s.substring(i, i + size));
    return parts;
}
// divide("abcdefgh", 4) -> [ab, cd, ef, gh]
```

---

## B6: Find all subsets of a string

```java
static void subsets(String s, String cur, int i, List<String> out) {
    if (i == s.length()) { out.add(cur); return; }
    subsets(s, cur + s.charAt(i), i + 1, out); // include char i
    subsets(s, cur, i + 1, out);               // exclude char i
}
// subsets("abc", "", 0, list) -> [abc, ab, ac, a, bc, b, c, ""] (2^n subsets)
```

Note: there are `2^n` subsets; each character is either included or excluded.

---

## B7: Find the longest repeating subsequence in a string

```java
// Longest subsequence appearing at least twice (indices must differ) — DP.
static int longestRepeatingSubseq(String s) {
    int n = s.length();
    int[][] dp = new int[n + 1][n + 1];
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            if (s.charAt(i - 1) == s.charAt(j - 1) && i != j)
                dp[i][j] = 1 + dp[i - 1][j - 1];
            else
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][n];
}
// "aabb" -> 2 ("ab")
```

Note: a variant of Longest Common Subsequence of the string with itself, disallowing the same index.

---

## B8: Find all the permutations of a string

```java
static void permute(char[] a, int k, List<String> out) {
    if (k == a.length) { out.add(new String(a)); return; }
    for (int i = k; i < a.length; i++) {
        swap(a, k, i);
        permute(a, k + 1, out);
        swap(a, k, i); // backtrack
    }
}
static void swap(char[] a, int i, int j) { char t = a[i]; a[i] = a[j]; a[j] = t; }
// permute("abc") -> abc, acb, bac, bca, cba, cab  (n! permutations)
```

---

## B9: Remove all white spaces from a string

```java
String s = "  Java  is  fun  ";
System.out.println(s.replaceAll("\\s", "")); // "Javaisfun"
```

---

## B10: Replace lower-case characters with upper-case and vice-versa

```java
String s = "Hello World";
StringBuilder sb = new StringBuilder();
for (char c : s.toCharArray()) {
    if (Character.isUpperCase(c)) sb.append(Character.toLowerCase(c));
    else if (Character.isLowerCase(c)) sb.append(Character.toUpperCase(c));
    else sb.append(c);
}
System.out.println(sb); // "hELLO wORLD"
```

---

## B11: Replace the spaces of a string with a specific character

```java
String s = "Java is fun";
System.out.println(s.replace(' ', '-')); // "Java-is-fun"
```

---

## B12: Determine whether a given string is a palindrome

```java
static boolean isPalindrome(String s) {
    int i = 0, j = s.length() - 1;
    while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
    return true;
}
// isPalindrome("madam") -> true
```

---

## B13: Determine whether one string is a rotation of another

```java
static boolean isRotation(String a, String b) {
    return a.length() == b.length() && (a + a).contains(b);
}
// isRotation("abcd", "cdab") -> true  (because "abcdabcd" contains "cdab")
```

Note: a rotation of `a` is always a substring of `a + a`.

---

## B14: Find maximum and minimum occurring character in a string

```java
String s = "test string";
Map<Character, Integer> freq = new LinkedHashMap<>();
for (char c : s.toCharArray()) if (c != ' ') freq.merge(c, 1, Integer::sum);
char max = Collections.max(freq.entrySet(), Map.Entry.comparingByValue()).getKey();
char min = Collections.min(freq.entrySet(), Map.Entry.comparingByValue()).getKey();
System.out.println("Max: " + max + ", Min: " + min);
```

---

## B15: Find reverse of the string

```java
String s = "Hello";
System.out.println(new StringBuilder(s).reverse()); // "olleH"
```

---

## B16: Find the duplicate characters in a string

```java
String s = "programming";
Map<Character, Integer> freq = new LinkedHashMap<>();
for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);
freq.forEach((c, n) -> { if (n > 1) System.out.println(c + " -> " + n); });
// r->2, g->2, m->2
```

---

## B17: Find the duplicate words in a string

```java
String s = "this is a test this is only a test";
Map<String, Integer> freq = new LinkedHashMap<>();
for (String w : s.split("\\s+")) freq.merge(w, 1, Integer::sum);
freq.forEach((w, n) -> { if (n > 1) System.out.println(w + " -> " + n); });
// this->2, is->2, a->2, test->2
```

---

## B18: Find the frequency of characters

```java
String s = "banana";
Map<Character, Long> freq = s.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(c -> c, Collectors.counting()));
System.out.println(freq); // {a=3, b=1, n=2}
```

---

## B19: Find the largest and smallest word in a string

```java
String s = "The quick brown fox jumps";
String[] words = s.split("\\s+");
String longest = words[0], shortest = words[0];
for (String w : words) {
    if (w.length() > longest.length()) longest = w;
    if (w.length() < shortest.length()) shortest = w;
}
System.out.println("Largest: " + longest + ", Smallest: " + shortest);
```

---

## B20: Find the most repeated word in a text file

```java
Map<String, Integer> freq = new HashMap<>();
try (BufferedReader br = new BufferedReader(new FileReader("input.txt"))) {
    String line;
    while ((line = br.readLine()) != null)
        for (String w : line.toLowerCase().split("\\W+"))
            if (!w.isEmpty()) freq.merge(w, 1, Integer::sum);
}
String most = Collections.max(freq.entrySet(), Map.Entry.comparingByValue()).getKey();
System.out.println("Most repeated: " + most);
```

Note: `try-with-resources` closes the reader automatically; `\\W+` splits on non-word characters.

---

## B21: Find the number of words in a given text file

```java
int words = 0;
try (BufferedReader br = new BufferedReader(new FileReader("input.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        String trimmed = line.trim();
        if (!trimmed.isEmpty()) words += trimmed.split("\\s+").length;
    }
}
System.out.println("Word count: " + words);
```

---

## B22: Separate the individual characters from a String

```java
String s = "Hello";
for (char c : s.toCharArray()) System.out.print(c + " "); // H e l l o
char[] chars = s.toCharArray(); // array of individual characters
```

---

## B23: Swap two string variables without using a third/temp variable

```java
String a = "Hello", b = "World";
a = a + b;                 // "HelloWorld"
b = a.substring(0, a.length() - b.length()); // "Hello"
a = a.substring(b.length());                 // "World"
System.out.println(a + " " + b); // World Hello
```

Note: uses concatenation and substring instead of a temp variable.

---

## B24: Print smallest and biggest possible palindrome word in a given string

```java
String s = "madam racecar wow level noon";
String smallest = null, biggest = null;
for (String w : s.split("\\s+")) {
    if (isPalindrome(w)) {                 // isPalindrome from B12
        if (smallest == null || w.length() < smallest.length()) smallest = w;
        if (biggest == null  || w.length() > biggest.length())  biggest = w;
    }
}
System.out.println("Smallest palindrome: " + smallest + ", Biggest: " + biggest);
// Smallest: wow, Biggest: racecar
```

---

## B25: Reverse a string in Java word by word

```java
String s = "Java is fun";
String[] words = s.split("\\s+");
StringBuilder sb = new StringBuilder();
for (int i = words.length - 1; i >= 0; i--) sb.append(words[i]).append(i > 0 ? " " : "");
System.out.println(sb); // "fun is Java"
```

---

## B26: Reverse a String without the reverse() function

```java
static String reverse(String s) {
    char[] a = s.toCharArray();
    int i = 0, j = a.length - 1;
    while (i < j) { char t = a[i]; a[i++] = a[j]; a[j--] = t; }
    return new String(a);
}
// reverse("Hello") -> "olleH"
```

Note: two-pointer swap from both ends, `O(n)` — no `StringBuilder.reverse()` used.

---

## Evaluation Tips

- For array problems, check that candidates handle **edge cases** (empty arrays, single element, duplicates, `k % n` for rotations) and know the difference between primitive `int[]` and boxed `Integer[]` when using comparators.
- For "Nth largest/smallest", look for the single-pass tracking approach (and correct handling of **distinct** vs non-distinct requirements) rather than full sorting.
- For string problems, look for `StringBuilder` over `+` in loops, correct use of `split` regexes, `try-with-resources` for file I/O, and knowledge of frequency maps (`merge`, `groupingBy`).
- Ask about time/space complexity — e.g. anagram sort `O(n log n)` vs count `O(n)`; permutations `O(n!)`; subsets `O(2^n)`.
