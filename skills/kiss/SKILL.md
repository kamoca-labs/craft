---
name: kiss
description: KISS (keep it simple). Use when a solution looks too clever for the problem, uses a pattern, library or layer where a simple construct works, or needs an explanation to be understood.
argument-hint: "[file or scope]"
user-invocable: false
---

# KISS: the simplest thing that passes the tests

**Rule**: between two solutions that pass the same tests, the one with **fewer concepts** for the reader to hold in mind wins. Simple does not mean short. Simple means obvious.

## Why

- Code is read many more times than it is written. Each extra concept costs on every read.
- Bugs hide in complexity. Obvious code has obvious bugs.
- The person who maintains the code at 3 AM is not you, rested.

## Violation signs

- A design pattern (factory, strategy, builder) for one case only.
- A language trick: a `reduce` that builds an object when a `for` would be clear, a nested ternary operator, metaprogramming.
- A new library for what the platform already does (`lodash.get` instead of `?.`, a date picker instead of `<input type="date">`).
- You need a comment or a diagram to explain the flow.
- Stored state that you could compute.

## How to apply

1. Ask: what is the most direct way to satisfy **these** tests?
2. Reuse before you write. Prefer, in this order: code that the project already has, a language feature, a platform or framework feature, an installed dependency, your own code.
3. Replace the clever with the explicit, even if it is one or two lines longer.
4. Remove derived state: compute it on the spot.

## Example

```ts
// before: clever
const byStatus = tickets.reduce<Record<string, Ticket[]>>(
  (acc, t) => ({ ...acc, [t.status]: [...(acc[t.status] ?? []), t] }), {})

// after: the platform already does it
const byStatus = Object.groupBy(tickets, (ticket) => ticket.status)
```

```ts
// before
const label = isAdmin ? (isOwner ? 'owner' : 'admin') : isOwner ? 'owner' : 'member'

// after
function roleLabel({ isAdmin, isOwner }: Member) {
  if (isOwner) return 'owner'
  if (isAdmin) return 'admin'
  return 'member'
}
```

## Limits

- Simple does not mean naive. Do not remove validation, error handling or security in the name of KISS.
- Between two equally simple forms, keep the one that is correct in the edge cases.

## Check question

Does a developer who never saw this code understand what it does in one read, without running it?
