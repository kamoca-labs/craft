---
name: functions
description: Clean Code, small functions that do one thing at one level of abstraction. Use when a function is long, has sections separated by blank lines or comments, mixes business rules with technical detail, or has a name with "and".
argument-hint: "[file or scope]"
user-invocable: false
---

# Small functions, one thing, one level

**Rule**: each function **does one thing**, does it well, and does only that. All its lines are at the **same level of abstraction**. The code reads from top to bottom like a story. The high-level function calls the lower-level ones, right after it.

"One thing" means you cannot extract another function from it with a name that is not just a restatement of the implementation.

## Why

- A small function has a name that says everything, so the caller does not need to open it.
- Mixed levels (business rule + string parsing + SQL) force the reader to switch context at every line.
- Small functions are naturally testable and reusable.

## Violation signs

- More than about 20 lines, or it does not fit on the screen.
- Blocks separated by a blank line or a comment (`// validate`, `// save`, `// notify`). Each block is a function.
- More than two levels of indentation.
- One line talks about "closing an invoice" and the next one talks about `JSON.parse` or an array index.
- A name with "and": `validateAndSave`.

## How to apply

1. Name each block with what it does. Extract it with that name.
2. The original function becomes the list of high-level steps.
3. Order them: the caller on top, the called functions right below (newspaper rule: headline first, detail after).
4. A loop body or an `if` body with more than two lines is often a function.

## Example

```ts
// before: three levels mixed
async function importCustomers(csv: string) {
  const rows = csv.split('\n').slice(1).map((line) => line.split(';'))
  for (const [name, email, document] of rows) {
    if (!email.includes('@')) continue
    const digits = document.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) continue
    await customers.upsert({ name: name.trim(), email: email.toLowerCase(), document: digits })
  }
}

// after: the high-level function tells the story
async function importCustomers(csv: string) {
  const candidates = parseCustomerCsv(csv)
  const valid = candidates.filter(isValidCustomer)
  await customers.upsertMany(valid)
}

function parseCustomerCsv(csv: string): Customer[] { /* ... */ }
function isValidCustomer(customer: Customer): boolean { /* ... */ }
```

## Limits

- Do not split into one-line functions that only rename the call below. If the extracted name says nothing more than the code, keep it inline.
- A long and linear function (a mapping `switch`, a list of routes) can stay long. It already does one thing.

## Check question

Can I describe the function in one short sentence that matches its name, without "and" and without "then"?
