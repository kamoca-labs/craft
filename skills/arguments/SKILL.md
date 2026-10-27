---
name: arguments
description: Clean Code, few arguments and no boolean flag. Use when a function has more than three parameters, same-type parameters in a row that are easy to swap, a boolean that changes behavior, or an output argument the function modifies.
argument-hint: "[file or scope]"
user-invocable: false
---

# Few arguments, no boolean flag

**Rule**: the ideal is zero to two arguments. Three arguments need a reason. More than three become an **object of named options**. Never pass a boolean to choose between two behaviors. Write two functions.

## Why

- The reader must understand each argument, and the test must combine each argument.
- `createUser('Ana', 'ana@x', true, false, 3)` is not readable at the call site. A wrong order still compiles.
- A boolean flag shows that the function does two things (`craft:functions`).
- An output argument (the function changes the object it receives) surprises the caller (`craft:side-effects`).

## Violation signs

- Four or more positional parameters.
- Two or more parameters of the same type in a row (`(from: Date, to: Date)` can be reversed).
- A literal `true`, `false` or `null` in the call, with no name.
- An `if (flag)` at the start that splits the function into two paths.
- A `void` function that fills the object it received.

## How to apply

- Boolean flag: split into two functions with their own names (`render(doc, true)` becomes `renderPreview(doc)` and `renderFinal(doc)`).
- Many related arguments: group them in a domain type (`period: { start, end }`, `address`).
- Many independent options: use a destructured options object with defaults.
- Output argument: return the new value instead of changing the received one.

## Example

```ts
// before
sendNotification(user, 'Invoice overdue', body, true, false)

function sendNotification(user: User, title: string, body: string, urgent: boolean, email: boolean) { /* ... */ }

// after
sendNotification({ to: user, title: 'Invoice overdue', body, priority: 'urgent', channel: 'push' })

function sendNotification({ to, title, body, priority = 'normal', channel = 'push' }: Notification) { /* ... */ }
```

## Limits

- An options object is not an excuse for a function that does everything. Many independent options can still show many responsibilities.
- Math functions with a natural order (`clamp(value, min, max)`, `point(x, y)`) stay positional.

## Check question

If I read only the call line, without opening the function, do I know what each value means?
