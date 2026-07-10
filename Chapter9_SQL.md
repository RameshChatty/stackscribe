# Chapter 9: SQL Tricky Questions

## Overview

SQL knowledge is essential for backend development. This chapter covers complex queries, joins, window functions, and performance optimization.

---

## Question 1: Complex JOIN Scenarios

### Answer:

**INNER JOIN vs LEFT JOIN vs RIGHT JOIN:**

```sql
-- Table: Users
| id | name  | department_id |
|----|-------|---------------|
| 1  | Alice | 1             |
| 2  | Bob   | 2             |
| 3  | Charlie | NULL        |

-- Table: Departments
| id | name        |
|----|-------------|
| 1  | Engineering |
| 2  | Sales       |
| 3  | Marketing   |

-- INNER JOIN (only matching)
SELECT u.name, d.name
FROM users u
INNER JOIN departments d ON u.department_id = d.id;
-- Result: Alice|Engineering, Bob|Sales (Charlie excluded)

-- LEFT JOIN (all from left table)
SELECT u.name, d.name
FROM users u
LEFT JOIN departments d ON u.department_id = d.id;
-- Result: Alice|Engineering, Bob|Sales, Charlie|NULL

-- RIGHT JOIN (all from right table)
SELECT u.name, d.name
FROM users u
RIGHT JOIN departments d ON u.department_id = d.id;
-- Result: Alice|Engineering, Bob|Sales, NULL|Marketing

-- FULL OUTER JOIN (all from both)
SELECT u.name, d.name
FROM users u
FULL OUTER JOIN departments d ON u.department_id = d.id;
-- Result: Alice|Engineering, Bob|Sales, Charlie|NULL, NULL|Marketing
```

**Multiple JOINs:**

```sql
-- Table: Orders
| id | user_id | product_id | quantity |
|----|---------|-----------|----------|
| 1  | 1       | 101       | 5        |
| 2  | 2       | 102       | 3        |
| 3  | 1       | 103       | 2        |

-- Table: Products
| id  | name     | price |
|-----|----------|-------|
| 101 | Laptop   | 1000  |
| 102 | Mouse    | 25    |
| 103 | Monitor  | 300   |

-- Complex query: User, Orders, Products
SELECT u.name, o.id as order_id, p.name as product_name,
       o.quantity, (o.quantity * p.price) as total
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
ORDER BY u.name, o.id;

-- Result:
| name    | order_id | product_name | quantity | total |
|---------|----------|--------------|----------|-------|
| Alice   | 1        | Laptop       | 5        | 5000  |
| Alice   | 3        | Monitor      | 2        | 600   |
| Bob     | 2        | Mouse        | 3        | 75    |
```

---

## Question 2: GROUP BY with HAVING

### Answer:

```sql
-- Find users with more than 2 orders
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 2;

-- Find top 3 products by revenue
SELECT p.name, SUM(o.quantity * p.price) as revenue
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY p.id, p.name
HAVING SUM(o.quantity * p.price) > 100
ORDER BY revenue DESC
LIMIT 3;

-- Users who spent more than average
SELECT u.name, SUM(o.quantity * p.price) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN products p ON o.product_id = p.id
GROUP BY u.id, u.name
HAVING SUM(o.quantity * p.price) > (
    SELECT AVG(total)
    FROM (
        SELECT SUM(o2.quantity * p2.price) as total
        FROM orders o2
        JOIN products p2 ON o2.product_id = p2.id
        GROUP BY o2.user_id
    ) subquery
);
```

**CASE in GROUP BY:**

```sql
-- Segment users by spending
SELECT
    CASE
        WHEN SUM(o.quantity * p.price) > 5000 THEN 'High'
        WHEN SUM(o.quantity * p.price) > 1000 THEN 'Medium'
        ELSE 'Low'
    END as segment,
    COUNT(DISTINCT u.id) as user_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN products p ON o.product_id = p.id
GROUP BY segment;
```

---

## Question 3: Window Functions

### Answer:

**ROW_NUMBER, RANK, DENSE_RANK:**

```sql
-- Table: Sales
| employee_id | salary | department |
|-------------|--------|-----------|
| 1           | 50000  | Sales     |
| 2           | 60000  | Sales     |
| 3           | 55000  | Sales     |
| 4           | 70000  | IT        |
| 5           | 65000  | IT        |

-- ROW_NUMBER (unique, no gaps)
SELECT employee_id, salary, department,
       ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM sales;

-- Result:
| employee_id | salary | department | rank |
|-------------|--------|-----------|------|
| 2           | 60000  | Sales     | 1    |
| 3           | 55000  | Sales     | 2    |
| 1           | 50000  | Sales     | 3    |
| 4           | 70000  | IT        | 1    |
| 5           | 65000  | IT        | 2    |

-- RANK (skips on tie)
SELECT employee_id, salary, department,
       RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM sales;
-- If two salaries are equal, both get same rank, next rank skipped

-- DENSE_RANK (no gaps)
SELECT employee_id, salary, department,
       DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank
FROM sales;
-- If two salaries are equal, both get same rank, next rank consecutive
```

**LAG and LEAD:**

```sql
-- Compare each row with previous/next
SELECT employee_id, salary,
       LAG(salary) OVER (ORDER BY employee_id) as prev_salary,
       LEAD(salary) OVER (ORDER BY employee_id) as next_salary,
       salary - LAG(salary) OVER (ORDER BY employee_id) as diff
FROM sales;

-- Detect salary increases
SELECT employee_id, salary,
       LAG(salary) OVER (ORDER BY hire_date) as previous_salary,
       CASE
           WHEN salary > LAG(salary) OVER (ORDER BY hire_date)
           THEN 'Increased'
           ELSE 'Decreased'
       END as salary_change
FROM employees;
```

**SUM OVER (Running Total):**

```sql
-- Running total of salary within department
SELECT employee_id, salary, department,
       SUM(salary) OVER (
           PARTITION BY department
           ORDER BY employee_id
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) as running_total
FROM sales;

-- Result shows cumulative salary for each department
| employee_id | salary | department | running_total |
|-------------|--------|-----------|---------------|
| 1           | 50000  | Sales     | 50000         |
| 2           | 60000  | Sales     | 110000        |
| 3           | 55000  | Sales     | 165000        |

-- Monthly sales with 3-month average
SELECT month, sales,
       AVG(sales) OVER (
           ORDER BY month
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) as moving_avg_3month
FROM monthly_sales;
```

**NTILE (Quartiles):**

```sql
-- Divide employees into salary quartiles
SELECT employee_id, salary,
       NTILE(4) OVER (ORDER BY salary DESC) as quartile
FROM employees;

-- Result: quartile 1 = top 25%, quartile 4 = bottom 25%
```

---

## Question 4: Common Table Expressions (CTE) and Recursive Queries

### Answer:

**Simple CTE:**

```sql
-- Find employees earning more than department average
WITH dept_avg AS (
    SELECT department_id, AVG(salary) as avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.employee_id, e.name, e.salary, da.avg_salary
FROM employees e
JOIN dept_avg da ON e.department_id = da.department_id
WHERE e.salary > da.avg_salary
ORDER BY e.department_id, e.salary DESC;
```

**Multiple CTEs:**

```sql
WITH high_earners AS (
    SELECT employee_id, salary
    FROM employees
    WHERE salary > 100000
),
young_employees AS (
    SELECT employee_id, age
    FROM employees
    WHERE age < 35
)
SELECT he.employee_id, he.salary, ye.age
FROM high_earners he
JOIN young_employees ye ON he.employee_id = ye.employee_id;
```

**Recursive CTE (Hierarchy):**

```sql
-- Organization chart
WITH RECURSIVE hierarchy AS (
    -- Base case: all managers
    SELECT employee_id, name, manager_id, 1 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: find direct reports
    SELECT e.employee_id, e.name, e.manager_id, h.level + 1
    FROM employees e
    JOIN hierarchy h ON e.manager_id = h.employee_id
)
SELECT REPEAT('  ', level - 1) || name as org_chart
FROM hierarchy
ORDER BY level, name;

-- Result:
| org_chart          |
|--------------------|
| CEO                |
|   VP Engineering   |
|     Senior Dev     |
|     Junior Dev     |
|   VP Sales         |
```

**Recursive CTE (Date Series):**

```sql
-- Generate all dates in range
WITH RECURSIVE date_series AS (
    SELECT '2024-01-01'::date as date
    UNION ALL
    SELECT date + interval '1 day'
    FROM date_series
    WHERE date < '2024-01-31'::date
)
SELECT * FROM date_series;
```

---

## Question 5: Performance Optimization and Index Strategy

### Answer:

**EXPLAIN PLAN:**

```sql
-- Analyze query execution
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND order_date > '2024-01-01';

-- Output shows:
-- Seq Scan = Full table scan (slow)
-- Index Scan = Uses index (fast)
-- Cost estimates
```

**Indexing Strategy:**

```sql
-- Single column index
CREATE INDEX idx_user_id ON orders(user_id);

-- Composite index (order matters!)
CREATE INDEX idx_user_date ON orders(user_id, order_date);
-- Helps queries with user_id or (user_id AND order_date)
-- Does NOT help queries with only order_date

-- Covering index (includes extra columns to avoid table lookup)
CREATE INDEX idx_user_date_amount
ON orders(user_id, order_date) INCLUDE (amount);
-- Covers SELECT amount FROM orders WHERE user_id = 1

-- Partial index (for specific rows)
CREATE INDEX idx_active_orders
ON orders(user_id) WHERE status != 'cancelled';
-- Much smaller index for frequently filtered condition
```

**Query Optimization:**

```sql
-- ❌ Inefficient: Functions disable indexes
SELECT * FROM orders WHERE YEAR(order_date) = 2024;

-- ✓ Efficient: Range query uses index
SELECT * FROM orders
WHERE order_date >= '2024-01-01'
  AND order_date < '2025-01-01';

-- ❌ Inefficient: OR with different columns
SELECT * FROM orders
WHERE user_id = 1 OR product_id = 5;

-- ✓ Efficient: UNION (can use separate indexes)
SELECT * FROM orders WHERE user_id = 1
UNION ALL
SELECT * FROM orders WHERE product_id = 5;

-- ❌ Inefficient: LIKE with wildcard at start
SELECT * FROM users WHERE name LIKE '%John%';

-- ✓ Efficient: LIKE with wildcard at end
SELECT * FROM users WHERE name LIKE 'John%';

-- ❌ Inefficient: NOT IN with subquery
SELECT * FROM users WHERE id NOT IN (
    SELECT user_id FROM orders WHERE status = 'failed'
);

-- ✓ Efficient: NOT EXISTS
SELECT * FROM users u WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = u.id AND o.status = 'failed'
);
```

---

## Question 6: Transactions and ACID Properties

### Answer:

```sql
-- ACID Transaction Example
-- Scenario: Transfer money between accounts

BEGIN TRANSACTION;

-- Read current balance (Atomicity)
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;

-- Atomic operations
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If any error:
ROLLBACK;

-- If success:
COMMIT;

-- Consistency: Accounts table always has valid data
-- Isolation: Other transactions don't see partial update
-- Durability: Data survives system failure

-- Isolation Levels
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;   -- Dirty read possible
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;     -- Repeatable read possible
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;    -- Phantom read possible
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;       -- Completely isolated

-- Deadlock Example
-- Transaction 1: Lock A, then Lock B
-- Transaction 2: Lock B, then Lock A
-- Result: Deadlock (both wait forever)

-- Prevention:
-- - Always acquire locks in same order
-- - Keep transactions short
-- - Use appropriate isolation level
```

---

## Summary

**Key SQL Concepts for Senior Developer:**

1. **Complex JOINs** - Multiple tables, different join types
2. **Aggregation** - GROUP BY, HAVING, aggregation functions
3. **Window Functions** - ROW_NUMBER, RANK, LAG/LEAD, running totals
4. **CTEs** - Simplify complex queries, recursion
5. **Performance** - Indexes, EXPLAIN plans, query optimization
6. **Transactions** - ACID, isolation levels, deadlock prevention
7. **Subqueries** - Correlated, EXISTS, IN clauses

**Interview Tips:**

- Start with simple query, add complexity
- Discuss index strategies
- Consider performance implications
- Know trade-offs between approaches
