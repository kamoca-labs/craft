# Scale and lean findings

Read this when the audit looks for scale or lean findings.

**Scale**: each finding states what happens with two requests, two processes or a large volume at the same time.

- Read, decide and write without a lock or a transaction (check-then-write race).
- The same work done by every process or every instance.
- Memory, a list or a cache that only grows.
- A query or a request for each item of a list.
- An algorithm with quadratic cost on a large input.
- State in one process that other processes must see.

**Lean**:

- Delete: dead code, an option, flag or config without use, a feature for an imagined need.
- Reuse: two helpers that do the same thing. Keep one and name the path.
- Platform: the standard library or the platform already does it, or a dependency does what a few lines can do.
- Abstraction without a second case: an interface with one implementation, a factory with one product, a wrapper that only passes the call.
- Merge: near copies that must change together.
- Split: a function or a class with several unrelated jobs. Split by job, never by line count.
