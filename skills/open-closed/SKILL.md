---
name: open-closed
description: O of SOLID, open/closed. Use when a new case (type, format, channel, rule) forces an edit to an existing if/switch, or when the same chain of conditionals by type repeats in several places.
argument-hint: "[file or scope]"
user-invocable: false
---

# O: open for extension, closed for modification

**Rule**: new behavior enters by **adding** a definition (an item in a map, a new class, a registered handler). It does not enter by editing branches that already work and are already tested.

## Why

- You do not touch tested code that runs in production to fit a new case, so it does not break.
- The new case lives in one place, with its own test.
- A `switch` by type often repeats in several places. To forget one of them is a classic bug.

## Signs of a violation

- A `switch (type)` or an `if/else if` chain by type, format or channel.
- The same chain of conditionals in more than one file.
- The PR/MR for "PIX support" edits five files that already existed.

## How to apply

1. Identify the axis of variation (payment type, export format).
2. Define the minimum contract that each variation meets.
3. Replace the `switch` with a table (a map from type to implementation) or with polymorphism.
4. A new case is a new entry in the table.

## Example

```ts
// before: each new format edits this function
function exportReport(report: Report, format: string) {
  if (format === 'csv') return toCsv(report)
  if (format === 'pdf') return toPdf(report)
  throw new Error(`unknown format: ${format}`)
}

// after: a new format is one line in the map
const EXPORTERS: Record<Format, (report: Report) => Buffer> = {
  csv: toCsv,
  pdf: toPdf,
}

function exportReport(report: Report, format: Format) {
  return EXPORTERS[format](report)
}
```

## Limits

- **YAGNI wins**: with only one case, there is no axis of variation. An `if` with two branches that never grow is simpler than a map.
- Create the extension when the **second or third** real case arrives, not before.
- A map of functions solves most cases. Use a class hierarchy only when each variation has state or several methods.

## Verification question

To add the next case, how many existing files do I edit? The ideal number is zero (or only the registry).
