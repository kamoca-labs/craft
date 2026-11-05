# Craft benchmark

This benchmark measures what craft changes in the code that Claude writes. Each cell is a real headless Claude Code session that edits a small seeded repo. The same model runs the same ticket twice: once without craft (`baseline`) and once with craft loaded from this repo (`craft`). The score comes from what the session leaves in the repo.

## Tasks

Each task is a ticket against a small TypeScript repo with existing code and tests. The ticket reads like a real one: it states the problem, not the solution. A hidden check runs the produced code after the session. The session never sees the check.

| Task | Ticket | What the hidden check catches |
|---|---|---|
| `attachment-limit` | reject attachments above 10 MB | the limit in the message, the type error kept |
| `config-env` | `DEBUG=false` turns debug on, `PORT` is a string | every false value, the port as a number in the other module |
| `csv-export` | a comma in a name breaks the export | quotes and line breaks, not only commas |
| `daily-timezone` | late sales land in the next day | the time zone of each shop, not a fixed offset |
| `duration-callers` | `'1h30m'` runs every 30 minutes | the fix in the shared parser, so the other caller works too |
| `idempotent-order` | a double click creates two orders | two clicks at the same time (a race), not only one after the other |
| `invoice-total` | show the total on the invoice | the same money format as the receipt (reuse of `formatMoney`) |
| `last-page` | the last partial page never shows | the page count and `hasNext` on an exact and a partial page |
| `overdue-badge` | make a badge red, with a label that never wraps | the color, the text color and `nowrap`. It is a visual-only change, so the report shows if the session added a test |
| `login-lockout` | lock an account after 5 failed logins | one account under attack does not lock the others |
| `product-slug` | accents and symbols in product URLs | accents, emoji, repeated dashes |
| `remove-flag` | remove a flag that is always off | the dead code and the dead file go too, the other flag stays |
| `retry-unavailable` | retry the provider during a deploy | no retry on a 404, a limit when the provider stays down |
| `spanish-messages` | show signup errors in Spanish | the messages that were written directly in the code |
| `split-bill` | a split bill loses a cent | the parts sum to the total, invalid input |
| `upload-path` | a file name escapes the uploads folder | `....//` and absolute paths, not only `../` |

Each task has a `good` and a `bad` reference. The self-test proves the check before any session runs: the seed fails, the good reference passes, the bad reference fails, and the seed tests pass.

## Metrics

| Metric | Source |
|---|---|
| hidden checks passed | the hidden check of the task |
| source lines changed | `git diff --numstat` of the session, added plus deleted, without tests |
| wrote a test | the session added lines to a test file |
| output tokens, cost, time, turns | the JSON output of the `claude` CLI |

## Isolation

- `--setting-sources project,local` removes the user settings, so no plugin that the user enabled loads.
- `--plugin-dir` loads craft from this repo in the `craft` arm only.
- `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` remove the CLAUDE.md files and the memory of the user.
- Each cell runs in a new temporary folder, outside any repo.
- The session can edit files and run `node --test`, `npm test` and `git diff`/`git status`. It cannot run any other command.
- Both arms get the same prompt suffix: the session works unattended and nobody answers a question.

## Run

```bash
node bench/run.ts --selftest                         # prove the checks, no session
node bench/run.ts --model sonnet --workers 5         # all tasks, both arms
node bench/run.ts --task split-bill,csv-export       # some tasks
node bench/run.ts --runs 3                           # 3 runs per cell
CRAFT_LEAN_DIR=<checkout> node bench/run.ts --arms baseline,craft-lean   # craft from another checkout
node bench/run.ts --report bench/runs/<stamp>        # report again from kept cells
```

Each cell keeps its workspace, its diff and the CLI output under `bench/runs/<stamp>/` (ignored by git). The report goes to `bench/results/<stamp>.md`.

## Limits

- One run per cell has noise. A difference of one or two cells is not a result.
- The tasks are small. Craft adds a fixed context at the start of each session, so on a small task its cost weighs more than on a real feature.
- A hidden check is a floor, not a proof of quality.
