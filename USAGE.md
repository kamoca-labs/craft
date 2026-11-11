# Using the `craft` plugin

## Contents

- [New project](#new-project)
- [New feature with ATDD](#new-feature-with-atdd)
- [Big requests: activities, /craft:craft and /goal](#big-requests-activities-craftcraft-and-goal)
- [Bug fix with ATDD](#bug-fix-with-atdd)
- [Visual-only change with style mode](#visual-only-change-with-style-mode)
- [Automatic refactor after green](#automatic-refactor-after-green)
- [Refactor on demand](#refactor-on-demand)
- [Combine with the git plugin](#combine-with-the-git-plugin)
- [English code, translated user-facing text](#english-code-translated-user-facing-text)
- [Test id on every interactive element](#test-id-on-every-interactive-element)
- [Writing in the ASD-STE100 standard](#writing-in-the-asd-ste100-standard)
- [Research before you trust](#research-before-you-trust)
- [A correction becomes a hook](#a-correction-becomes-a-hook)
- [Project memory](#project-memory)
- [When a hook is wrong](#when-a-hook-is-wrong)

## New project

```
/craft:setup
```

Claude detects the stack, shows the plan (dependencies, configs, limits), and **waits for your approval**. Then it installs the linter with the craft limits and creates the `test` and `lint` scripts. In CLAUDE.md, it writes only two things: the line that says to record project decisions in the repo (never in the local memory of Claude), and the test and lint commands. It does not list the other skills or the limits, because they arrive by themselves. Violations in existing code are only counted, not fixed. From then on, `/craft:craft` runs this lint before the triage.

## New feature with ATDD

```
/craft:craft reject an attachment above 10 MB on the request
```

1. Claude writes the scenarios and **waits for your approval**. It goes through the list of real-world edge cases (long text, emoji, timeout, 403, double submit, and others). It includes only the ones that the feature has:

   ```gherkin
   Scenario: an attachment above the limit is rejected
     Given an open request
     When the user uploads an 11 MB attachment
     Then the response is 422
     And the message states the 10 MB limit
   ```

2. It writes the test of **one** scenario and runs it: `Step 3 (Red): 1 failing, expected 422 got 201`.
3. It writes the minimum code: `Step 5 (Passing): 1 passing`. If the specification has another scenario, it goes back to step 2 with the next one.
4. With all scenarios green, the hook injects the triage. Claude loads only what has a signal and refactors: `Step 6 (Refactor): dry, limit unified in MAX_ATTACHMENT_SIZE. No signal in the others`. When performance has a signal, Claude measures the current form, compares at least two forms, and puts the table in the `perf` commit.
5. It runs the tests of the touched domains: `Step 7 (Passing again): 34 passing in tests/Feature/Request and tests/Unit/Attachment`.

## Big requests: activities, /craft:craft and /goal

Craft starts only when you call it. For a big request, plan first, then execute:

```
/craft:plan implement the pagination of the orders screen: endpoint, screen and tests
/craft:craft orders-pagination-3f2a
```

`/craft:plan` asks every open decision in rounds of options, writes the activity, and the `goldfish` subagent (Haiku, fresh context) lists each point where it must guess. Each gap comes back to you as a question, for at most 3 rounds. Claude organizes the request into a linear list. The request does not come in order, so Claude lists the pieces with what each one needs, and the CLI sorts them: every item comes after what it needs. A cycle is rejected with the path. The list is a file you can open and follow, even though git ignores it:

```
.claude/local/activities/orders-pagination-3f2a/index.md
```

```markdown
Status: active
Next: T2 List screen pages through the API
Progress: 1/3 required items verified
Blocked: none

## Sequence

- [x] 1. T1 Orders endpoint returns pages
- [ ] 2. T2 List screen pages through the API  <- next
- [ ] 3. T3 Page links survive a reload

### [x] 1. T1 Orders endpoint returns pages
- Accept: page 2 of 25 orders with size 10 returns 10 items and total 25; page 0 returns 400
- Check: command
- Command: npm test -- orders.api
- Evidence: pass at 2026-11-10T14:02:11Z, evidence/T1-1.txt
```

How it works:

- **One line at a time.** The first line that is not verified is `Next`. Only that item accepts `begin`, `done`, `verify` and `approve`. When it is verified, the next line becomes `Next`.
- **Verified means evidence.** `verify` runs the check itself and records the result with a seal. A box that you or Claude check by hand is ignored and redrawn. A change in the criterion, in the check, or in the `watch` files reopens the item.
- **The `activity-gate` hook (Stop)** gives Claude the next item, the missing criterion and the command, until every required item is verified. It never runs checks. A blocked item is skipped only by items that do not need it. When everything left is blocked, there is no progress, the stop limit is reached, or the verifier crashes twice, the activity ends as **incomplete**, with the state saved and the reason in the file.
- **Replan.** New work found during the job goes in with `replan --reason`. Ids and valid evidence stay, and the history records why.
- **A very complex request.** The plan can mark an item with `detail`. `index.md` stays the parent. The item moves to a child file `T2-api-pages.md`, and its outputs go to the folder `T2-api-pages/`.
- **Not only code.** A guide or a report works too: the check is a `review` that Claude approves with what it saw, a `human` approval with your words, or a simple command.
- **Evidence by kind of item.** An API item runs a command with a known input and fails when a limit is broken (status, response, time). A screen item attaches captures (images show inline in `index.md`, and you open them at no cost to the session). Files that a check writes to `$ACTIVITY_EVIDENCE_DIR`, or that `approve --attach` adds, are sealed.
- **You reject, Claude reworks.** If a screen "does not look good", say so. Claude runs `reopen` with your words: the item and every item that depends on it come back as `Next`, Claude adjusts, collects new evidence and approves again.
- **Token cost.** Each CLI command prints one short line. A 6-item activity costs about 9 thousand tokens (an estimate by character count, not a measurement). Captures taken by a command of the project cost no image tokens in the session; look at each capture once.
- **Cards.** There is no Jira or Asana integration. `export` writes a dry run (`cards.json`) with a stable key per item, and `link` keeps the link to a card, so a repeat updates the same card.

### Keep going, resume, and /goal

- The hook holds the turn while there is work, but nothing can force the work to finish: Ctrl+C, disabled hooks, an authentication or credit error, and an item that needs your decision all stop it. The hook never ends the turn in silence: the activity ends complete or incomplete.
- The stop limit counts stops **without new evidence**, so an activity that makes progress does not reach it. Claude Code also overrides any Stop hook after 8 blocks in a row without a tool call.
- To continue an incomplete activity, send a message. Claude runs `resume --from <old session>` first, which keeps the id, the evidence and the history. For a wait on an outside event (a CI result), Claude blocks the item and schedules its own resume.
- `/goal` is a native command that only you can type, at the start of a message. A skill, a hook or Claude cannot run it, so there is no binding "under the hood". It works with the hook: the evaluator of `/goal` reads only the transcript, so the hook asks for the line `ACTIVITY COMPLETE: <id>, N/N verified` when everything is verified. Claude prints the ready condition on request (`goal-line`).
- Two ways to use both. In two messages: first `/craft:craft <big request>`, then paste the `/goal` line. In one message: `/goal use craft:craft to organize and run <big request>, done when the reply shows ACTIVITY COMPLETE`.
- `/craft:craft <request> /goal` in one message does not work: a command is recognized only at the start of the message, and chaining is for skills, not for the built-in `/goal`.

## Bug fix with ATDD

```
/craft:craft a department without an owner breaks the listing
```

Step 1 becomes the scenario that reproduces the bug. Step 3 proves that the test catches the bug **before** the fix.

## Visual-only change with style mode

```
/design:style request card with more breathing room and a modal that opens smoothly
```

1. Claude loads `/design:style` from the design plugin, which includes Impeccable. A separate Impeccable installation is not required. If design is unavailable, Claude reports the missing plugin.
2. It creates a reviewable mockup artifact or a Figma/FigCraft design with the applicable screen states and responsive variants. You review and iterate until you explicitly approve it. Existing approval for the same artifact and scope is reused. Product implementation starts only after this gate; there is no prior red behavioral test for a visual-only change.
3. It implements the approved screen and inspects the rendered result. When the screen is accepted, Claude runs relevant existing filtered functional checks once, fixes once if something broke, and stops. It does not add assertions for colors, exact sizes, CSS classes or animation timing. Rendered review covers appearance, breakpoints and applicable states.

### Mixed feature: screen with back end

```
/design:style attachments screen with the 10 MB limit
```

The limit is a rule. Claude asks for the order with `AskUserQuestion`:

| Option | What happens |
|---|---|
| Back end first (recommended) | `/craft:craft` covers the contract and the limit rule. Then style mode iterates on the screen with real data |
| Screen first | Style mode iterates on the screen with fixed data. Then `/craft:craft` builds the back end and replaces the mock with real data |
| By slice | Each scenario goes through `/craft:craft`, and its visual part goes through style mode before the next scenario |

In all three options, the rule enters only with a test. If Claude tries to change the service before any test, the `test-first` hook denies the edit and asks for the failing test first.

## Automatic refactor after green

No command is needed. Each time Claude runs tests and the output has a success summary and no failure, the `refactor-on-green` hook injects a short reminder. When all scenarios are green, Claude loads the `craft` triage:

| Command run | Output | Injects? |
|---|---|---|
| `pnpm vitest run` | `Tests  21 passed (21)` | yes |
| `php artisan test` | `Tests:  48 passed` | yes |
| `pnpm vitest run \| tail` | `Tests  1 failed \| 20 passed` | no (the pipe hides the failure) |
| `node --test ...` | `# fail 1` | no |
| `grep -rn describe tests/` | any | no (it does not run tests) |
| `node --test ... \| tail -5` | only the stack of an assertion | no (no success summary) |
| `python3 - <<'EOF'` with `npm test` in the text | any | no (the runner is only text) |

## Refactor on demand

```
/craft:craft app/Actions/UploadAttachment.php
/craft:craft what changed in this branch
```

Claude first looks for what it can delete (root rule). Then it triages all principles, loads only the skills with a signal, applies one at a time without a behavior change, and at the end runs the tests of the touched domains. It makes one triage round, one batch of fixes, and at most one confirmation round. Then it stops. The report says what changed per principle and which principles had no signal.

If the change alters the UI (component, CSS, template), the report suggests `/design:review` on the touched files. Claude does not run it as a refactor side effect. The design plugin includes Impeccable; no separate upstream installation is required. If design is unavailable, Claude reports the missing plugin and the pending visual review.

For one principle only, ask for it by name. Claude reads its reference in `skills/craft/references/`:

```
apply the errors principle to app/Services/PaymentGateway.php
clean the tests in tests/Feature/UploadTest.php
review the E2E suite in tests/e2e/
```

The E2E review (`e2e-tests.md`) deletes from the E2E suite each assert that does not stop the user from reaching the goal (appearance, exact text, field by field). It moves the business rule to the unit test. The loading, empty, error, and no-permission states enter when the screen has them.

The same rule applies to unit, component and integration tests: a functional test checks behavior, not appearance. `skills/craft/references/clean-tests.md` owns this rule, and the other test references point to it. Screenshot comparisons are created only on an explicit request, in a separate visual suite.

## Combine with the git plugin

```
/craft:craft reject an attachment above 10 MB
... steps 1 to 7 ...
/git:commit
```

The commit body (and the PR/MR description, if you open one) reuses the specification of step 1 as the "Why".

## English code, translated user-facing text

The `english-code` hook denies non-English text in a code file:

| Edit | Result |
|---|---|
| `throw new Error('Fichier supérieur à 10 Mo')` in `src/upload.ts` | denied: the sentence goes to `src/locales/fr.json` and the code uses `t('attachment.tooLarge')` |
| `function calculerPrénom()` in `app/Price.php` | denied: use an English name such as `calculatePrice` |
| `'tooLarge' => 'Fichier supérieur à :max Mo'` in `lang/fr/attachment.php` | allowed (translation folder) |
| text in another language in a `.md`, `.json`, or `.po` file | allowed (not code) |
| `it('rejects an attachment above the limit')` in `tests/Feature/AttachmentTest.php` | allowed (test file: `tests/`, `test/`, `__tests__/`, `spec/`, `*.test.*`, `*.spec.*`, `*_test.*`, `test_*.py`) |

The hook does not detect English text written directly in the code for the user (`<button>Save</button>`). The triage of `/craft:craft` catches it through the reference `i18n.md`. A project without i18n gets a proposal for the default library of the stack, with your approval before the installation. The same reference catches dates, numbers, and currencies formatted by hand (use `Intl`). The reference `i18n-layout.md` catches a fixed width in a text container, and `margin-left` where `margin-inline-start` fits. The reference `english-code.md` covers names, comments, and logs in another language.

## Test id on every interactive element

The `test-id` hook denies an interactive element without `data-testid` in `.vue`, `.jsx`, and `.tsx`:

| Edit | Result |
|---|---|
| `<button @click="save">Save</button>` | denied: `<button data-testid="profile-save-button" @click="save">` |
| `<Card onClick={open}>` | denied: the handler makes the component interactive |
| `` <li :data-testid="`item-${index}`"> `` | the hook allows it, but the triage of `/craft:craft` catches the index through the reference `test-ids.md`: use the SKU |
| `<button class="btn" v-bind="$attrs">` in a `BaseButton.vue` | allowed (the test id arrives through the parent) |
| `<button>Save</button>` in `src/components/Form.test.tsx` | allowed (test file) |

The test finds the element with `getByTestId` first. Removing the attribute in the production build is optional: `/craft:setup` asks about it.

## Writing in the ASD-STE100 standard

There is no command. `/craft:craft` reads `skills/craft/references/ste.md` before it writes a doc, a commit, a PR/MR or the activity. That text follows ASD-STE100 (Simplified Technical English, Issue 9):

| Before | After |
|---|---|
| "The verification of the config should be done by the user before the deployment is run, otherwise a failure may occur." | "Check the config before the deploy. If the config is wrong, the deploy fails." |
| "Hook config file path override" | "the path that overrides the hook configuration" |
| "You might wanna take out the old file" | "Remove the old file." |

Replies follow your language. English text follows the full standard. Text in another language follows the rules that fit any language: a sentence of at most 20 words in a procedure and 25 in a description, active voice, one imperative instruction per sentence, one term per concept, and no semicolons. Code, commands, and text pasted by the user stay as they are.

## Research before you trust

There is no command. `/craft:craft` reads `skills/craft/references/engineer.md` at the start of each call. Claude stops answering from memory:

| Section | What Claude does |
|---|---|
| Evidence before you trust or act | Before it uses a version, an image tag, a package name, a flag, or an API that can change, Claude looks in the repo, the documentation, the registry, the CLI, or the web. It cites the source. Without a source, it writes "not verified". It treats a claim of yours about a fact as wrong until a proof says it is right. A preference or a decision of yours is not a fact |
| State of the art | Before it implements something (a Dockerfile, a CI pipeline, a framework feature), Claude looks for the official guide and the expert practice, applies them, and cites the sources. If the practice differs from the pattern of the repo, it asks you which one to follow |

Example:

> You: "Use the `node:16` image, it is the current LTS."
> Claude: "This is not correct. Node 16 reached end of life. The current LTS is `<version>` (source: `<link>`). I use `node:<version>-slim`. Do you want to keep `node:16`?"

## A correction becomes a hook

You correct Claude (for example, "do not run `git add .env`"). Claude judges if the correction repeats, if the tool input can check it, and if the pattern is rarely wrong. If the answer is yes to all three, it proposes the hook and **waits for your approval**. Then it writes the test, the rule in TypeScript in `.claude/hooks/rules/`, and the message in `.claude/hooks/locales/en.json`, and it wires the hook in `.claude/settings.json`. If the correction needs judgment, it goes to the skill of the subject or to CLAUDE.md, not to a hook. The cheap and sure check denies at once (`PreToolUse`). The expensive or judgment check runs once at `Stop`, on the files touched in the session. To ask directly:

```
/craft:hook never commit .env
```

## Project memory

`/craft:craft` reads the catalog at the start of each call and follows `skills/craft/references/memory.md`. To remember or forget something yourself, use `/craft:memory`. When a conversation brings something that matters for the next one, Claude writes it in the project:

```
.claude/memory/
├── MEMORY.md                      only the catalog, one line per memory
├── feedback_tests-in-container.md
└── project_deploy-freeze.md
```

```markdown
- [Tests in the container](feedback_tests-in-container.md): run tests with docker compose exec, never on the host
```

To ask directly:

```
/craft:memory integration tests need the local Redis
/craft:memory forget the deploy freeze rule
```

If Claude tries to write to the local auto memory (`~/.claude/projects/<project>/memory/`), the `memory-outside-project` hook denies it and says to write to `.claude/memory/`.

## When a hook is wrong

The hooks act only while a craft activity is active in the session. Outside an activity, they allow every action.

| Error | Example | What to do |
|---|---|---|
| It injected with a red suite | a new runner with a failure format that the hook does not know | Take the line from `~/.claude/hook-cases.jsonl`, paste it in `hooks/tests/cases.json` with `"inject": []`, and add the pattern to `FAILURE` |
| `english-code` denied text that is neither user-facing text nor code | domain data (a city name in a seed) | Move the data to JSON or CSV. If a translation folder has another name, add it to `TRANSLATION_FOLDER` with a test in `english-code.test.ts` |
| `test-id` denied an element that is not interactive | a decorative anchor `<a>`, or a loose `>` in an attribute without quotes | Add the `data-testid` anyway. If the tag reading is wrong, fix `OPENING_TAG` with a test in `test-id.test.ts` |
| `filtered-tests` denied a run that is already filtered | a filter that the hook does not know | Add the filter to `FILTER_FLAG` or `TEST_PATH` with a test in `filtered-tests.test.ts` |
| `push-gate` denied the push in a project with CI | a CI with a config outside the list | Add the path to `CI_CONFIGS` in `hooks/lib.ts` with a test in `push-gate.test.ts` |
| It did not inject with a green suite | a test runner that the hook does not know | Write the case in `cases.json` with `"inject": ["refactor-on-green"]` and add the runner to `TEST_RUNNER` |

Before you change the hook, classify the finding (`skills/hook/references/hook-denied.md`). Real problem: fix it. False positive with evidence: make the narrowest possible exception, with the reason `"<who decided>: <evidence>"` in the commit. Doubt: ask the user once. A wide exception (a whole file, a whole rule) needs a request from the user.

The full procedure is in [turn a real case into a test](https://github.com/kamoca-labs/marketplace/blob/main/USAGE.md#turn-a-real-case-into-a-test).
