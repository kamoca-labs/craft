---
name: errors
description: Clean Code, errors handled in an explicit way and never swallowed. Use when there is an empty catch, a catch that only logs and goes on, a silent null/false for an error, an error code return, a generic message, a failure that never reaches someone who can act, or a screen error with no recovery step.
argument-hint: "[file or scope]"
user-invocable: false
---

# Explicit errors, never swallowed

**Rule**: every error has a clear destination. It is **handled** by the code that knows what to do with it, or **propagated** with context to the code that knows. It never disappears. Fail early and fail loud, with a message that says what went wrong and with which data.

## Why

- A swallowed error becomes corrupted data or strange behavior, far from the cause, hours later.
- A silent `null` pushes the problem to the caller, and the caller usually does not check.
- A message with context reduces the investigation from hours to minutes.

## Violation signs

- An empty `catch {}`, or `catch (e) { console.log(e) }` that goes on as if nothing happened.
- A `try/catch` that returns `null`, `false` or `[]` on failure, so it looks the same as "no data".
- A generic `catch` around a large block, which also catches programming bugs.
- `throw new Error('error')`, or a message without the identifier involved.
- An error rethrown without the original cause (`throw new Error('failed')` that loses the `cause`).
- A promise with no `await` and no `.catch`.
- A user message with an internal code, a stack trace or the raw `error.message`.
- A form that clears the fields after an error.
- A network error on screen with no retry action.

## How to apply

1. For each `catch`, decide: **do I know how to recover here?** If not, do not catch. Let it go up.
2. If you catch to add context, rethrow with `cause`.
3. An expected domain error (not found, no permission, invalid state) becomes its own type, handled at the boundary (HTTP 404/403/422).
4. Validate input at the boundary and throw early, before partial effects.
5. Message: what failed + with which data + (if it helps) what to do.
6. The `try` wraps only the line that can fail in that way.

## Error that the user sees

Step 5 is for developers. The error that reaches the user follows these rules:

- The message states the problem and how the user recovers. Example: "The file is 11 MB. Upload a file of 10 MB or less."
- The message does not promise a cause or a solution that the system does not know.
- A form with an error keeps what the user typed.
- A network error offers a retry action.
- The text goes through the i18n of the stack and is never written in the code (`craft:i18n`).

## Example

```ts
// before: the failure disappears, the caller gets null and goes on
async function loadConfig(path: string) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'))
  } catch (e) {
    console.log(e)
    return null
  }
}

// after: a missing file is an expected case, invalid JSON goes up with context
async function loadConfig(path: string): Promise<Config> {
  const content = await fs.readFile(path, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '{}'
    throw error
  })
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`invalid config at ${path}`, { cause: error })
  }
}
```

## Limits

- Catching to **recover** is correct (retry, documented fallback, a default value covered by a test).
- At the system boundary (HTTP handler, job, CLI), a generic handler that logs and answers 500 is the right place for the "catch all".
- Do not turn every error into a custom exception. Create a dedicated type only for what someone will handle in a different way.

## Check question

If this operation fails in production, does someone learn about it, with enough information to act, without the system going on with wrong data? If the error reaches the user, does the user know what to do next?
