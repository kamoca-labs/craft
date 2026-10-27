---
name: hook
description: Turns a user correction into a project hook, so the mistake does not repeat. Use when the user corrects something you did (command, file, code pattern) and the tool input can check the rule, or when asked to create a hook or a guaranteed rule in the project.
argument-hint: "<behavior that must not repeat>"
---

# Correction becomes a hook

A remembered correction is lost in the next session. A correction guaranteed by a hook does not come back. Each time the user corrects you, decide whether the correction fits a hook.

## When a hook is worth it

Ask the three questions. Create a hook only with three yes answers:

1. **Does it repeat?** The correction is about a pattern (every commit, every migration file, every `docker compose`), not about a single case.
2. **Can the input check it?** You can decide with only what the tool receives (path, content, command, command output), by regex or a simple file read, without judgment.
3. **Is it rarely wrong?** The denied pattern does not catch legitimate use. A false positive blocks the work and costs more than the error it prevents.

Check each question against the concrete correction before you propose:

| Correction | Repeats? | Checkable? | Rarely wrong? | Result |
|---|---|---|---|---|
| "commit without `Co-Authored-By`" | yes, every commit | yes, the message is in the `git commit` command | yes, the trailer is literal | hook that denies (like `git:no-co-author`) |
| "never `git add .env`" | yes | yes, by the command | yes | hook that denies |
| "this variable name says nothing" | yes | no, it needs judgment | no | skill `craft:naming` |
| "in this file, use lib X" | no, single case | yes | yes | only the correction |

If the answer is no:

| Situation | Where the correction stays |
|---|---|
| Needs judgment (design, good name, library choice) | skill of the subject, or CLAUDE.md if it is project context |
| Single case | only the correction, no record |
| Context that helps after an event (for example, green suite) | hook that **injects** context, instead of denying |

**Propose and wait for the ok**: state the correction, the rule, the event (`PreToolUse`, `PostToolUse` or `Stop`, and the matcher), one denied example and one allowed example. A hook is enforcement. The user decides.

## Two layers

Choose the event by the cost and the certainty of the check:

| Check | Event | Example |
|---|---|---|
| Mechanical, cheap and unambiguous | `PreToolUse`: denies at once, before the tool runs | `git add .env`, `.only` in a test |
| Expensive, or needs the judgment of the model | `Stop`: runs once at the end, over the files touched in the session | lint of many files, heuristic that can be wrong |

- Both layers pass through the three questions above. In `Stop`, the hook finds the candidate and the model judges each finding.
- When in doubt between the two, choose `Stop`. An immediate denial interrupts the work, so it must be right.
- `Stop` reads only the files touched in the session (from the transcript or from `git diff`), not the whole project.
- `Stop` does not repeat a finding that the `PreToolUse` layer already reported.
- To report, `Stop` exits with `exit 2` and the list of findings on stderr. With no new finding, it exits with `exit 0`, silent.
- If the input has `stop_hook_active` true, allow. The findings already came out once.

## How to write

- **TypeScript**, run directly with `node` (Node 22.18+ runs `.ts` without a build), no dependency: only `node:fs`, `node:path`, `node:test`. Even in a PHP or Python project, the hook is TypeScript.
- **Code in English**. The message the user reads comes from the translation file, in the language of the user (`craft:i18n`).
- **Follow `craft:atdd`**: the test of the hook comes before the rule and fails first.
- One rule per file and per entry in settings. Deny only the exact pattern of the correction.
- To deny: message on stderr and `exit 2` (the message says what to do instead). To inject: JSON with `hookSpecificOutput.additionalContext` on stdout and `exit 0`.
- When in doubt (unreadable file, unexpected input), allow. A broken hook must not block the session.

Layout in the project (committed, so it applies to the whole team):

```
.claude/
  settings.json            # connects each rule to the event
  hooks/
    lib.ts                 # readInput, deny, message
    locales/en.json        # messages for the user, one file per locale
    rules/<rule>.ts
    tests/<rule>.test.ts   # node --test .claude/hooks/tests/
```

```ts
// .claude/hooks/rules/no-env-commit.ts
import { deny, readInput } from '../lib.ts'

const input = readInput()

if (/\bgit\s+add\b.*\.env\b/.test(input.tool_input.command || '')) {
  deny('no-env-commit')
}
```

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/rules/no-env-commit.ts\"", "timeout": 10 }]
      }
    ]
  }
}
```

If the project already has hooks, follow the layout and the lib that exist.

## After you create it

- Run the tests of the hook and show one denied case and one allowed case.
- Tell the user that the hook applies from the next session.
- If the correction applied to every project, not only this one, suggest moving it to a plugin.

## When a project hook denies

Every finding of a hook falls into one of three cases:

| Case | What to do |
|---|---|
| Real problem | Fix what the hook pointed at. |
| False positive with evidence | Record the narrowest possible exception in the repo, with the reason. State the exception in the reply. |
| Doubt | Leave the finding standing. Ask the user once, in one line. |

- Evidence is a fact you can cite: a test fixture, an intentional example in the docs, a choice the user already confirmed.
- The reason follows the format `"<who decided>: <evidence>"`. Example: `"user confirmed: the seed uses city names in another language"`.
- Write "user confirmed" only when the user really confirmed.
- The narrowest exception covers one value, one line or one path. A wide exception (whole file, whole rule) needs a request from the user.
- Never use an exception to force through a denied edit.
- Record the exception where the rule already accepts one (a list in the rule itself), with a test of the allowed case. The reason goes in the body of the commit.

This section is a policy, not a mechanism. Do not create new code only to record exceptions.
