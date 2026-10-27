---
name: single-responsibility
description: S of SOLID, single responsibility. Use when a module, class, component or function changes for more than one reason, mixes business logic with I/O or presentation, or grows by collecting different concerns.
argument-hint: "[file or scope]"
user-invocable: false
---

# S: single responsibility

**Rule**: each module has **only one reason to change**. A "reason" is a person or area that asks for a change. Finance asks for a different calculation rule, design asks for a different layout, infrastructure changes the database. If two of them change the same file, the file has two responsibilities.

This is not "does only one thing" (that rule is for functions, see `craft:functions`). It is about **who** forces the change.

## Why

- A change to one concern does not break another concern in the same file.
- The test of each part stays small and has no unrelated setup.
- Two developers who work on different concerns do not conflict in the same file.

## Signs of a violation

- The name needs "and" or is generic: `UserManager`, `Helper`, `Utils`, `processAndSave`.
- The same file imports the database, HTTP and screen formatting.
- To test the calculation rule, you must build a request or mock the database.
- The git history shows commits about unrelated concerns in the same file.

## How to apply

1. List the reasons for change of the module (one line each).
2. Group the code by reason.
3. Extract each group to a module that has the name of its reason. The original becomes a coordinator or disappears.
4. Run the tests of the module after each extraction.

## Example

```ts
// before: calculation, persistence and email in the same place
async function closeInvoice(id: number) {
  const invoice = await db.invoice.find(id)
  invoice.total = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.95
  await db.invoice.save(invoice)
  await mailer.send(invoice.customerEmail, `Total: ${invoice.total}`)
}

// after: the discount rule changes alone, without a touch to the database or email
function invoiceTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.95
}

async function closeInvoice(id: number) {
  const invoice = await invoices.find(id)
  invoice.total = invoiceTotal(invoice.items)
  await invoices.save(invoice)
  await notifyInvoiceClosed(invoice)
}
```

## Limits

- If the parts **always** change together, they are one responsibility. A split only spreads the reading.
- Do not create one class per line. The goal is cohesion, not minimum size.

## Verification question

Describe the module in one sentence, without "and". If you cannot, it still has more than one responsibility.
