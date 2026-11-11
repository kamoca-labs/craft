# Spec format

Read this before you create or repair a spec file in `.claude/local/plans/<slug>.md`.

```markdown
---
subject: <the subject in one line>
slug: <slug>
status: open | complete
updated: <YYYY-MM-DD>
rounds: <number of rounds>
---

# <subject>

## Goal
<what is true when the work is done, in the words of the user>

## Facts
- <fact> (source: <path, command or URL>)

## Decisions
- **<title>**: <answer>. Decided by the user in round <n>.

## Open questions
- **<title>**: <the question and its options>

## Out of scope
- <item>: <reason from the user>
```

- A fact without a source is an assumption. Move it to **Open questions**.
- The slug is short, in English, and comes from the subject (`orders-pagination`).
- `.claude/local/.gitignore` holds the line `*`. Create it if it does not exist, so git ignores the folder.
