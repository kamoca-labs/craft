# Activity: a request as a linear list of verified items

An activity turns a request into numbered items. Each item has an output you can observe. You do one item at a time, from the first line to the last. The `activity-gate` hook (Stop) keeps the turn open while an item has no evidence. The CLI and the session id are in the header of `SKILL.md`. Work that is not code fits too (a guide, a report): use a `review` check or a simple command.

## 1. Decide and organize

- A request to do something starts an activity. A question or an analysis does not: answer it. A small task gets one item. Do not invent items. With an active activity in the session, change it with `replan`.
- The request does not come in order. List the pieces and what each one needs. Write them in any order with `needs` for real dependencies only. The CLI sorts them so each item follows what it needs. A cycle is rejected with its path: cut it with a shared contract, smaller items, or one item verified as a unit.
- Each item delivers something observable with what exists up to that line. An API is verified in its own item. The proof that the screen uses it is a later item. A pure layer with no output joins its neighbor or gets an output (a contract, a reproducible test data set).

| Field | Content |
|---|---|
| `title`, `do` | The result, and the concrete change. |
| `needs` | Ids that must be verified first. |
| `accept` | The expected result that approves the item. Add the error case when the request has one. |
| `check` | A command string, or `{"kind":"command","command":"...","expect":"regex"}`, or `{"kind":"review"}`, or `{"kind":"human"}`. |
| `observe` | Where to look. Optional for a command check (it defaults to the command). |
| `watch` | Folders whose change makes the evidence stale. |
| `detail` | `true` to give the item its own file and folder (see 5). |
| `id` | Optional. The CLI gives `T<n>`. It never changes. |

Derive `accept` from the request and from the behavior the repo promises to keep. Use the checks the project already has, filtered to the touched domain, never the full suite. Write an assumption in `accept` when you need one.

## 2. Start

Write the plan as JSON (`goal`, `items`) in a temporary file outside the repo, then run `start`. Show the user the ordered list. The file is `.claude/local/activities/<slug>/index.md`: local, never committed, and the user can open it at any time.

```json
{"goal": "Paginate the orders list", "items": [
  {"title": "Orders endpoint returns pages", "do": "Add page and size to GET /orders", "accept": "page 2 of 25 orders, size 10: 10 items, total 25; page 0: 400",
   "check": "npm test -- orders.api", "watch": ["src/orders"]},
  {"title": "List screen pages through the API", "do": "Wire the pager", "needs": ["T1"], "accept": "pager shows page 2; next goes to page 3",
   "check": {"kind": "review"}}
]}
```

## 3. Work one item at a time

Read `Next`. Only that item accepts `begin`, `done`, `verify`, `approve`. Each command prints one short line.

1. `begin <id>`, do the item (follow `craft:atdd` for a change of behavior), `done <id>`.
2. A `command` check: `verify <id>`. The CLI runs it and records the evidence. A failure keeps the item open: fix the cause and run it again.
3. A `review` check: collect the evidence and `approve <id> --by claude --note "<what you saw>" [--attach f1,f2]`. You approve it yourself. The user can reject it later (see 4).
4. A `human` check: ask the user, wait, then `approve <id> --by user --quote "<their words>"`. Never approve it yourself.

Never edit boxes, `State` lines or evidence lines by hand: the hook ignores them. Changed `watch` files, or a prerequisite verified again, make the evidence stale: run `verify` again.

## 4. Choose the evidence by the kind of item

Spend tokens only where the proof needs them.

- **API.** A `command` check with a known input. The command prints status and the key part of the response, and fails (exit code) when a limit is broken, for example a time over the budget. To keep the full request and response, write them to `$ACTIVITY_EVIDENCE_DIR`.
- **Screen.** A `review` check. Capture only the viewports named in `accept` (default 1280 and 390 wide, long edge up to 1000 px). Prefer a capture command of the project that writes to `$ACTIVITY_EVIDENCE_DIR`, so the image never enters your context. Check `npx playwright --help` for the screenshot command first. Without such a command, use the browser tool with one capture per viewport. Look at each capture once, then approve with `--attach`. Do not capture again unless the files under `watch` changed. Compare with the Figma frame when the request has one, and say what you could not verify.
- **Refactor.** A `command` check on the tests of the affected behavior, plus a command that proves the structural change.
- Files in `$ACTIVITY_EVIDENCE_DIR` and `--attach` files are sealed, and `index.md` shows them (images inline). The user can open them without a token cost to the session.

**The user rejects a result.** When the user says an item "is not good", run `reopen <id> --reason "<what is wrong>" --by user --quote "<their words>"`. The item (and every item that depends on it) returns to the list as `Next`. Adjust the work, collect new evidence, and approve again. Do the same when you see the problem yourself (`reopen <id> --reason ...`).

## 5. Change the plan, block, split, resume

- New work found: `replan --plan <file> --reason <why>`. Ids and valid evidence stay. An item with a changed `accept` or check reopens. Removing a required item needs a reason.
- No access or decision, or an outside dependency: `block <id> --reason <why>` and go on with the next item that does not need it. If every path is blocked, the hook ends the activity as incomplete and says what unblocks it.
- A wait for an outside event (a CI result): block the item, end the turn, and schedule your own resume as the session allows, with the prompt "resume the activity <slug>". Never schedule more than three resumes without progress.
- A very complex request, or an item with its own notes and artifacts: `"detail": true`, or `split <id>`. `index.md` stays the parent. The child `<id>-<title>.md` holds the fields and evidence of the item, and the folder `<id>-<title>/` holds its outputs.
- A stopped activity (limit, no progress, crashed verifier, blocked) is saved. In a new session run `resume --from <old session>` first.

## 6. End

- The hook gives the next item, the criterion and the command until every required item is verified. Then it asks for the result: start the reply with `ACTIVITY COMPLETE: <id>, N/N verified`, then give the evidence of each item.
- The turn can end as incomplete. The hook says why. Tell the user what is pending and what unblocks it.
- `/goal` is typed only by the user. If asked, run `goal-line` and give the line ready to paste. Never say you set a goal.
- Cards for Jira or Asana: `export` writes a dry run with stable keys. `link <id> <ref>` keeps the link to an existing card. Publishing needs an explicit request.
