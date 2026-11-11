# Activity file format

Read this only to repair or understand an activity file. The CLI writes it. Do not edit it by hand, except `## Notes`.

## Layout

```
.claude/local/          local to this machine, never committed
  .gitignore            "*", so git ignores the whole folder
  .seal                 the key of the evidence seals
  activities/
    <slug>/             one folder per activity
      index.md          the parent: header, next item, progress, list, items, notes, history
      T2-api-pages.md   a child file (only for an item with a File line)
      T2-api-pages/     the outputs of that child
      evidence/         the outputs of the items that stay in index.md
                        T1-1.txt (the command output), T1-1/ (the files of that attempt: captures, responses)
```

`.claude/local/` is the place for any file that belongs to one machine and must never be committed. Its own `.gitignore` is the only rule, so the project `.gitignore` stays untouched.

## index.md

- Frontmatter: `activity`, `goal`, `session`, `status` (`active`, `complete`, `incomplete`), `reason`, `stops` (stops without new evidence), `max_stops`, `total`, `max_total`, `no_progress`, `evidence_seen`, `resumes`, `last_signature`. The `session` field links the activity to a session.
- Derived lines: `Status`, `Next`, `Progress`, `Blocked` and the `## Sequence` list with the checkboxes. The CLI recomputes them on every write. A box that you check by hand is ignored.
- `## Items`: one `### [ ] <number>. <id> <title>` block per item, in the order of execution. Lines `- Key: value`: `State` (`pending`, `in_progress`, `implemented`), `Needs`, `Do`, `Observe`, `Accept`, `Check` (`command`, `review`, `human`), `Command`, `Expect`, `Exit`, `Timeout`, `Watch`, `Required`, `Blocked`, `Card`. A newline in a value is written as `\n`.
- Evidence: a line `<!-- evidence {json} -->` per attempt, plus a readable `- Evidence:` line and a `- Files:` line (images inline) for the current one. A `reopen` writes a `rejected` record, so the item is open again.
- `## Notes`: free text for the user. Every rewrite keeps it.
- `## History`: start, replan, reopen, remove, block, resume and incomplete, with the reason.

## What makes an item verified

An item is verified only when it has a sealed evidence record that passed, and:

- the signature of the record equals the signature of the item now (a hash of id, observe, accept and check), so a changed criterion or command reopens the item;
- the seal is valid: an HMAC with the key in `.seal` over the item, the outcome, the signature, the fingerprint, the time, the hash of the output file and the hashes of the attached files;
- the fingerprint of the `watch` paths is the same as when the check ran;
- every prerequisite is verified, with evidence not newer than this one (a prerequisite verified again makes this evidence stale).

Only `verify` and `approve` write evidence. `verify` runs the command itself. The outcomes are `pass`, `approved`, `fail`, `rejected` and `error` (a crash or timeout of the verifier, which is not a failed criterion). The seal protects against a mistake or a naive self-approval. It does not protect against someone who reads `.seal` on purpose.
