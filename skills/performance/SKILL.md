---
name: performance
description: Performance in the refactor, driven by data and comparison. Use in ATDD step 6 or in a refactor when code runs on a hot path or over much data, with nested loops, repeated linear search, a query inside a loop (N+1), repeated I/O or external calls, serial independent calls, or in-memory filtering of what the database filters.
argument-hint: "[file or scope]"
user-invocable: false
---

# Performance with data and comparison

**Rule**: in the refactor, after readability, look for the performance gain that the **real data** justifies. Measure the current form. Write **at least two** justified forms. Keep the one that wins **with a number**. Without a measurement, the most readable form wins.

## Why

- Readable code can still be slow at real volume. The refactor is the safe moment to change the form: the green suite proves that the behavior does not change.
- An optimization without a measurement often misses the target. It trades readability for a gain that nobody feels.
- The comparison between forms prevents the first idea from winning by default. The second form sometimes wins by a large margin. Sometimes it ties and shows that the optimization is not worth it.

## Understand the data first

- **Size**: how many items, rows or calls exist today, and how fast they grow.
- **Frequency**: how many times the code runs per request, per screen or per job.
- **Shape**: the distribution of the data (many repeats, few large items, unique key).
- **Source**: a count query on the dev database, the log, the seed with production volume or the profiler.

If the collection has 10 items and the code runs once per request, stop here. The most readable form wins.

## Signs

- A loop inside a loop over collections that grow (`find` or `filter` inside `map`).
- A query, request or file read inside a loop (N+1).
- An external call repeated with the same argument.
- Independent calls in series (one `await` after the other).
- Everything loaded into memory to filter, sort or count what the database does.
- A regex, a serialization or an expensive object created again in each loop pass.
- A frequent query without an index (`EXPLAIN` shows a full scan).

## How to apply

1. **Data**: find the real size and frequency from the list above.
2. **Baseline**: measure the current form with the input at real volume. Use the median of 3 runs. Use the tool of the stack: `vitest bench`, `pytest-benchmark`, `go test -bench`, `EXPLAIN ANALYZE`, the HTTP response time.
3. **Alternatives**: write at least two forms, each with a hypothesis for the gain. Examples: a `Map` by id instead of a linear search, a `join` instead of a query in a loop, a batch fetch, parallel calls.
4. **Compare**: use the same input, the same measurement and the same green tests.
5. **Choose**: keep the form that wins by more than the measurement noise (usually 20% or more). If no form wins, keep the most readable one and delete the others.
6. **Record**: put the comparison table in the body of the `perf` commit. Use a dedicated commit, separate from the behavior.

```text
perf(report): index sales by customer before building the report

| Form                         | Median (10k sales)   |
|------------------------------|----------------------|
| find inside map (current)    | 840 ms               |
| Map by customerId            | 12 ms                |
| GROUP BY in the database     | 18 ms                |
```

## Example

```ts
// before: O(customers x sales)
const report = customers.map((customer) => ({
  customer,
  total: sales.filter((sale) => sale.customerId === customer.id).reduce(sumAmount, 0),
}))

// after: one pass over the sales, measured 70x faster with 10k sales
const totalByCustomer = groupTotals(sales, (sale) => sale.customerId)
const report = customers.map((customer) => ({ customer, total: totalByCustomer.get(customer.id) ?? 0 }))
```

## Limits

- Never optimize without a number before and after. "It looks faster" does not count.
- Never trade readability for a gain inside the measurement noise.
- Measure in the same environment where the code runs. If the project runs in a container, measure in the container.
- An architecture change (cache, queue, read replica) is not a refactor. It is a decision. Propose it to the user with the measurement and record it in the repo.

## Verification question

Does each optimization in scope have a number before and after, measured at real volume, and did it beat at least one other form?
