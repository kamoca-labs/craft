---
name: guard-clauses
description: Clean Code, guard clause instead of nested conditional. Use when there is an if inside an if, an else after return/throw, the main path of the function is indented at the end, or validations wrap the useful code.
argument-hint: "[file or scope]"
user-invocable: false
---

# Guard clause instead of nested conditional

**Rule**: handle the exception cases and the early exits **at the top**, with an immediate `return` or `throw`. The happy path stays at the end, without indentation, and reads in a straight line.

## Why

- Each `if` level is a context that the reader must stack in their head.
- With guard clauses, each precondition is an isolated line: easy to read, test and remove.
- An `else` after a `return` is noise. The `return` already ended the flow.

## Violation signs

- Indentation of three levels or more.
- `if (valid) { ...20 lines... } else { throw }`, with the error far below the condition.
- An `else` after `return`, `throw`, `continue` or `break`.
- A `result` variable accumulated only to have a single `return` at the end.

## How to apply

1. Invert the condition of each `if` that wraps the rest of the function, and exit early.
2. Remove the `else` after an exit.
3. In loops, use `continue` to skip the invalid item instead of wrapping the body.
4. Merge guard clauses that form one rule into a named function (`if (!canClose(invoice)) ...`).

## Example

```ts
// before
function approve(request: Request, user: User) {
  if (request) {
    if (request.status === 'pending') {
      if (user.canApprove) {
        request.status = 'approved'
        return request
      } else {
        throw new Forbidden()
      }
    } else {
      throw new InvalidState()
    }
  }
  throw new NotFound()
}

// after
function approve(request: Request | undefined, user: User) {
  if (!request) throw new NotFound()
  if (request.status !== 'pending') throw new InvalidState()
  if (!user.canApprove) throw new Forbidden()

  return { ...request, status: 'approved' }
}
```

## Limits

- Two branches of equal weight (not exception versus happy path) can stay as `if/else` or a simple ternary.
- Many guard clauses in a row (more than five) show a validation that needs its own function or schema.

## Check question

Is the main path of the function at indentation level zero, after all the early exits?
