---
name: side-effects
description: Clean Code, no hidden side effects. Use when a function writes, sends, changes global state, mutates the received argument or does I/O that the name does not announce, such as a get that creates, a validate that saves or a format that logs.
argument-hint: "[file or scope]"
user-invocable: false
---

# No hidden side effects

**Rule**: the function name **announces everything** that the function changes in the world. A function that sounds like a query (`get`, `is`, `has`, `calculate`, `format`, `validate`) changes nothing. A function that changes something says what it changes (`save`, `send`, `create`, `markAsPaid`). Separate query from command.

## Why

- The caller trusts the name. An `isValid(order)` that reserves stock causes a phantom stock bug.
- You can call a pure query again, reorder it, cache it and test it without setup.
- A hidden effect creates temporal coupling: "you must call `check` before `save`, or it breaks".

## Signs of a violation

- A `getX` that creates `X` when it finds nothing.
- A `validate`, `check` or `is` that writes, sends or changes the object.
- A function that mutates the received argument (`items.sort()` on the caller array, `Object.assign(input, ...)`).
- A write to a module variable or a global.
- A query that triggers an audit log, an event or an email.

## How to apply

1. For each function, list what it changes outside its own scope.
2. If the name does not announce it, **rename** the function to announce it, or **split** it into a pure query and a command.
3. Return a new value instead of mutating the received one (`toSorted`, spread, `structuredClone`).
4. Push the effects to the edge: the core calculates, the outer layer writes and sends.

## Example

```ts
// before: the "get" creates, and the caller does not know
async function getCart(userId: number) {
  return (await carts.findByUser(userId)) ?? (await carts.create({ userId }))
}

// after: the name tells the truth
async function findOrCreateCart(userId: number) {
  return (await carts.findByUser(userId)) ?? (await carts.create({ userId }))
}
```

```ts
// before: mutates the caller array
function topScores(scores: number[]) {
  return scores.sort((a, b) => b - a).slice(0, 3)
}

// after
function topScores(scores: number[]) {
  return scores.toSorted((a, b) => b - a).slice(0, 3)
}
```

## Limits

- A diagnostic log and a metric do not count as a business effect. They do not need to be in the name.
- A transparent internal cache (memoization) is acceptable if the observable result is the same.

## Verification question

If I call this function twice in a row, or do not call it, does anything in the system change without a warning in its name?
