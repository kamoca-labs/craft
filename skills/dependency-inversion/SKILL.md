---
name: dependency-inversion
description: D of SOLID, dependency inversion. Use when business logic imports a database, HTTP, LLM, storage, queue, clock or randomness directly, when a test needs a module mock to isolate, or when a vendor change would force a change to the logic.
argument-hint: "[file or scope]"
user-invocable: false
---

# D: dependency inversion

**Rule**: business logic depends on **abstractions that it defines itself**. The details (database, API, LLM, storage, clock) implement these abstractions and are **injected** from outside. The dependency arrow points inward, to the domain.

## Why

- You test the logic with simple doubles. You need no module `vi.mock`, no network and no database.
- A vendor change (S3 to disk, OpenAI to Claude) does not touch the logic.
- Injected time and randomness make the test deterministic.

## Signs of a violation

- `import { db } from '@/db'`, `fetch(...)`, `new OpenAI()`, `Date.now()` or `Math.random()` inside business logic.
- The test of the logic depends on `vi.mock('../db')` or on a running container.
- The vendor return type (the raw SDK response) leaks into the domain.

## How to apply

1. Find the boundary: what is I/O or non-deterministic.
2. Define, on the logic side, the minimum contract that it needs (`interface Clock { now(): Date }`). Use domain types.
3. Receive the contract as a parameter or in the constructor.
4. Implement the real adapter outside the logic. Assemble everything at the entry point (route, command, framework DI container).
5. In the test, pass a literal double.

## Example

```ts
// before: you cannot test the due date without control of the global clock
function isOverdue(invoice: Invoice) {
  return invoice.dueDate < new Date()
}

// after: time comes from outside
function isOverdue(invoice: Invoice, today: Date) {
  return invoice.dueDate < today
}
```

```ts
// the logic defines the contract with domain types
interface Summarizer {
  summarize(text: string): Promise<string>
}

async function summarizeTicket(ticket: Ticket, summarizer: Summarizer) {
  return summarizer.summarize(ticket.description)
}

// test
await summarizeTicket(ticket, { summarize: async () => 'summary' })
```

In Laravel, prefer constructor injection and a bind in the service container. Do not use a `Facade` inside the domain.

## Limits

- **YAGNI wins**: do not create an interface for code that is not I/O and does not vary. You can import a pure helper directly.
- One real implementation plus the test double already justify the contract at an I/O boundary. Away from a boundary, wait for the second implementation.
- Do not inject what the framework already resolves well at the entry point. A controller can use the ORM directly if it has no logic.

## Verification question

Can I test this logic with literal objects, without a module mock or an external service?
