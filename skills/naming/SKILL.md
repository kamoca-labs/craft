---
name: naming
description: Clean Code, names that reveal intent. Use when variables, functions, classes, files or folders have an abbreviated name, a generic name (data, info, handle, manager, utils), a misleading name, or a name that needs the code or a comment to be understood.
argument-hint: "[file or scope]"
user-invocable: false
---

# Names that reveal intent

**Rule**: the name answers **why it exists, what it does and how to use it**, without the need to read the implementation. If the name needs a comment, the name is wrong. This applies to variables, functions, types, files and folders.

## Why

- A name is the documentation that people always read and that never gets outdated alone.
- A good name makes an error visible: `const total = items.length` stands out.
- A folder structure with clear names removes the need for a project map.

## Violation signs

- Abbreviation: `usr`, `qty`, `tmp`, `cb`, `e` (outside a two-line `catch`).
- Generic: `data`, `info`, `item`, `obj`, `result`, `handle`, `process`, `Manager`, `Helper`, `Utils`.
- Filler word: `theUser`, `userObject`, `userData` when `user` is enough.
- Misleading: a `getUser` that creates the user when it does not find one, an `isValid` that also saves, a `list` that is a `Set`.
- A number in the name: `user2`, `handleClick2`.
- Different names for the same concept (`fetch`/`get`/`retrieve`), or the same name for different concepts.

## How to apply

- **Boolean**: a yes or no question (`isOverdue`, `hasAttachment`, `canEdit`).
- **Function**: verb + object, which says the effect (`sendInvoice`, `calculateDiscount`). If the honest verb is "and", split it (`craft:functions`).
- **Value**: a domain noun, with the unit when there is one (`timeoutMs`, `maxSizeMb`).
- **Collection**: plural (`tickets`). A map says the key (`ticketsById`).
- **Magic constant** becomes a name (`MAX_LOGIN_ATTEMPTS = 5`).
- **Vocabulary**: the vocabulary of the business and the project. One term per concept, in all the code.
- Length proportional to scope: `i` in a three-line loop, a full name for anything exported.

## Example

```ts
// before
function chk(d: Ticket[]) {
  return d.filter((x) => x.dt < Date.now() - 864e5 * 3 && x.st === 1)
}

// after
const STALE_AFTER_DAYS = 3

function staleOpenTickets(tickets: Ticket[], now: Date) {
  const cutoff = subDays(now, STALE_AFTER_DAYS)
  return tickets.filter((ticket) => ticket.status === TicketStatus.Open && ticket.updatedAt < cutoff)
}
```

## Limits

- Established conventions are valid: `i`/`j` in short loops, `id`, `url`, `req`/`res` where the framework uses them.
- Renaming a public API breaks its consumers. Do it with a deprecation, not in the middle of a refactor.

## Check question

If I read only the signatures and names (no bodies), can I tell what the module does?
