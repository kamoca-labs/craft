---
name: comments
description: Clean Code, no explanatory comments in code. Use when a comment says what the code does, separates sections, is commented-out code, is outdated, or is a TODO with no owner. The name says what, and the commit or docs say why.
argument-hint: "[file or scope]"
user-invocable: false
---

# No explanatory comments

**Rule**: the code says **what** through names and structure. The **why** of a decision goes in the commit message, the PR/MR description or the documentation. A comment that explains what the code does shows a missing name or a missing function.

## Why

- A comment is not executed and not tested. It becomes outdated in silence and starts to lie.
- An explanatory comment shows code that does not explain itself. Fix the code.
- `git blame` leads to the commit, and the commit has the full context of the decision.

## Violation signs

- `// increment the counter` above `count++`.
- A comment that separates sections inside a function (`// validate`, `// save`). Each section is a function (`craft:functions`).
- A comment that explains a variable. The variable name is weak (`craft:naming`).
- Commented-out code. Git keeps it, so delete it.
- A `// TODO` with no ticket and no owner, forgotten for months.
- A comment that contradicts the code.

## How to apply

1. For each comment, ask: would a better name or an extracted function say this? If yes, do it and delete the comment.
2. A commented complex condition becomes a named function or constant (`const isEligibleForRefund = ...`).
3. Commented-out code: delete it.
4. The why of a non-obvious decision: move it to the commit body.

## Example

```ts
// before
// checks if the user can see the ticket (owner or in the same department, and not archived)
if ((ticket.ownerId === user.id || user.departmentIds.includes(ticket.departmentId)) && !ticket.archivedAt) {

// after
if (canView(user, ticket)) {

function canView(user: User, ticket: Ticket) {
  const isInvolved = ticket.ownerId === user.id || user.departmentIds.includes(ticket.departmentId)
  return isInvolved && !ticket.archivedAt
}
```

## Comments that stay

- A warning about something non-obvious and dangerous that the code cannot express (`// the vendor API returns 200 with an error body`), when there is no way to encapsulate it.
- A docblock of a public API used by third parties, or one that a tool requires (PHPDoc types, lint directives, license).
- A reference to an external specification (RFC, ticket) on a rule that looks arbitrary.

## Check question

If I delete this comment, does an attentive reader lose any information that the code does not give? If not, delete it.
