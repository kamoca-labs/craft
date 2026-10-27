---
name: dry
description: DRY (don't repeat yourself). Use when the same business rule, constant, text, validation or style appears in more than one place, a rule change needs edits in many files, or generic code (format, convert, date math) is tied to one case.
argument-hint: "[file or scope]"
user-invocable: false
---

# DRY: each piece of knowledge has one source

**Rule**: each piece of **knowledge** (a business rule, a limit, a text, a style, a format) is written in **one place only**. DRY is about knowledge, not about similar lines.

## Why

- A rule change means editing one place, not hunting for copies.
- Copies drift apart with time and become bugs ("the limit is 10 MB in the front end and 5 MB in the back end").

## Violation signs

- The same magic number in two files (`10 * 1024 * 1024`).
- The same validation in the front end and the back end, written by hand twice.
- The same message text copied in many components.
- A rule change that needed a PR/MR with the same edit in N files.

## How to apply

1. Confirm that it is the **same knowledge**. If the rule of one changes, must the rule of the other change too? Only then extract.
2. Give the knowledge a name (`MAX_ATTACHMENT_SIZE`, `isBusinessDay`).
3. Put it at the lowest level that all uses can reach.
4. For knowledge that crosses boundaries (front end and back end), generate it from one source (shared schema, config endpoint) instead of copying it.

## Example

```ts
// before: the limit in two places, one day they drift apart
if (file.size > 10 * 1024 * 1024) throw new TooLarge()
// ...in another file
const hint = 'Maximum 10 MB'

// after
export const MAX_ATTACHMENT_MB = 10
if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) throw new TooLarge()
const hint = `Maximum ${MAX_ATTACHMENT_MB} MB`
```

## Generic code is born reusable

Code that is not specific to the implementation (format, convert, validate a format, retry a call, compute a date) does not wait for repetition. Write it as its own function, in a module for the subject (`date.ts`, `retry.ts`), where the next case finds it:

- it has a generic name.
- it receives only what it uses.
- it imports nothing from the current case.

Written this way, the function costs the same number of lines. The next feature imports it instead of writing it again. The business rule of the case stays with the case.

```ts
// before: the generic calculation is tied to the ticket rule
function isOverdue(ticket: Ticket) {
  const days = Math.floor((Date.now() - ticket.openedAt.getTime()) / 86_400_000)
  return days > ticket.slaDays
}

// after: the generic calculation lives in date.ts and serves any case
export function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

function isOverdue(ticket: Ticket) {
  return daysSince(ticket.openedAt) > ticket.slaDays
}
```

If the project already has `date-fns`, use `differenceInDays` and do not write `daysSince` (`craft:kiss`).

## Accidental duplication: do not extract

```ts
const userAge = (user: User) => yearsSince(user.birthDate)
const contractAge = (contract: Contract) => yearsSince(contract.signedAt)
```

They look the same today, but they are different rules. If the contract starts to count from the effective date, only one changes. Merging them would create a false coupling.

## Limits

- **Rule of three**: on the second repetition, take note. On the third, extract. Duplication costs less than the wrong abstraction. This rule applies to merging knowledge that is already duplicated. It does not apply to new generic code.
- A test can repeat data in an explicit way. Test readability is worth more than DRY (see `craft:clean-tests`).
- An extraction that needs a flag to handle "the case of one and the case of the other" shows that it was not the same knowledge.

## Check question

If this rule changes tomorrow, in how many places do I edit? The answer must be one.
