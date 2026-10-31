# Using the `craft` plugin

## Contents

- [New project](#new-project)
- [New feature with ATDD](#new-feature-with-atdd)
- [Tasks and goal](#tasks-and-goal)
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

Claude detects the stack, shows the plan (dependencies, configs, limits), and **waits for your approval**. Then it installs the linter with the craft limits and creates the `test` and `lint` scripts. In CLAUDE.md, it writes only three things: the line that says to follow `/craft:atdd`, the line that says to record project decisions in the repo (never in the local memory of Claude), and the test and lint commands. It does not list the other skills or the limits, because they arrive by themselves. Violations in existing code are only counted, not fixed. From then on, `/craft:craft` runs this lint before the triage.

## New feature with ATDD

```
/craft:atdd reject an attachment above 10 MB on the request
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
4. With all scenarios green, the hook injects the triage. Claude loads only what has a signal and refactors: `Step 6 (Refactor): craft:dry, limit unified in MAX_ATTACHMENT_SIZE. No signal in the others`. When performance has a signal, Claude measures the current form, compares at least two forms, and puts the table in the `perf` commit.
5. It runs the tests of the touched domains: `Step 7 (Passing again): 34 passing in tests/Feature/Request and tests/Unit/Attachment`.

## Tasks and goal

In step 1, `/craft:atdd` loads the skill `craft:acceptance-criteria`: each `Then` states an observable value, and each scenario names the test that proves it. After you approve the specification, it follows `craft:tasks`, which the hook already injected in the session. Claude creates one task per scenario (`TaskCreate`), plus the refactor and the passing again. You follow the list with `Ctrl+T`.

When the `TaskCreate` tool is on, Claude finds the criterion by itself (the scenarios, your request, or the project scripts) and sets the goal without asking. If no command can prove the result, it creates only the tasks. You can also call `/craft:tasks <what to do>`. The first task of the list is the `META:` task:

```
TaskCreate: META: the 3 scenarios of the specification pass
  Verification: `pnpm vitest run tests/unit/attachment` exits with code 0 after the last code edit.
  Constraints: no test skipped, deleted, or edited to pass.
  Limit: 6 blocks.
```

When the work ends, the final reply always carries the closing, met or not: the `META:` task becomes `completed`, and the `META CLOSED:` line cites the command and the result.

- Claude Code does not let the model run `/goal`. For this reason, the goal is the `META:` task plus the `meta-goal` Stop hook. You type nothing.
- The `meta-goal` hook is a script, without an agent, so it uses no tokens. It reads the transcript and holds the end of the turn until the verification command runs with the expected result. It does not run commands. For this reason, Claude cites the command and the result at the end of each step.
- The hook also requires the closing: if the condition is met and the `META CLOSED:` line is missing, it blocks once and asks for the closing.
- The hook releases the end of the turn when Claude asks for your approval, when the goal reaches the block limit, and after the closing. If you refuse the goal in your own words, Claude writes `META CLOSED: refused by the user`. If you tell Claude to stop, it closes the goal with the reason and says the goal was not met.
- Without the `TaskCreate` tool, the goal becomes a `META:` line in the text of the reply, with the same parts.
- The hook has no panel, no check-ins, and no restore of the native `/goal`. It works in every session and acts only after the goal is declared.
- In some sessions `TaskCreate` comes as a deferred tool, and Claude loads the schema with `ToolSearch`. If the tool does not exist even then, Claude writes the list in the reply and asks if it can enable the tool. With your approval, it keeps a copy of `~/.claude/settings.json`, adds `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }`, and opens a test session to confirm. The tool appears in the next session. You edit nothing by hand.

### Several activities in the same request

Outside ATDD, Claude also follows `craft:tasks` when your request has more than one activity ("fix the login, update the README, and start the service"). It splits the request into tasks, shows the list, and sets the goal. The verification of the goal is one command that proves the final state of all activities.

## Bug fix with ATDD

```
/craft:atdd a department without an owner breaks the listing
```

Step 1 becomes the scenario that reproduces the bug. Step 3 proves that the test catches the bug **before** the fix.

## Visual-only change with style mode

```
/craft:style request card with more breathing room and a modal that opens smoothly
```

1. Claude loads `/impeccable`. If the skill is not installed, Claude asks for the installation and waits.
2. It changes the screen. You look and ask for the next adjustment. There is no specification and no red test.
3. You say the screen is ok. Claude runs the filtered tests of the touched component and E2E once, fixes once if something broke, and stops.

The `atdd-first` hook allows `Card.vue`. If Claude tries to edit `src/services/request.ts`, the hook denies the edit and points to `/craft:atdd`.

### Mixed feature: screen with back end

```
/craft:style attachments screen with the 10 MB limit
```

The limit is a rule. Claude asks for the order with `AskUserQuestion`:

| Option | What happens |
|---|---|
| Back end first (recommended) | `/craft:atdd` covers the contract and the limit rule. Then style mode iterates on the screen with real data |
| Screen first | Style mode iterates on the screen with fixed data. Then `/craft:atdd` builds the back end and replaces the mock with real data |
| By slice | Each scenario goes through `/craft:atdd`, and its visual part goes through style mode before the next scenario |

In all three options, the rule enters only with a test. The hook denies the service without `/craft:atdd`.

## Automatic refactor after green

No command is needed. Each time Claude runs tests and the output has no failure, the `refactor-on-green` hook injects the `craft` triage as context:

| Command run | Output | Injects? |
|---|---|---|
| `pnpm vitest run` | `Tests  21 passed (21)` | yes |
| `php artisan test` | `Tests:  48 passed` | yes |
| `pnpm vitest run \| tail` | `Tests  1 failed \| 20 passed` | no (the pipe hides the failure) |
| `node --test ...` | `# fail 1` | no |
| `grep -rn describe tests/` | any | no (it does not run tests) |

## Refactor on demand

```
/craft:craft app/Actions/UploadAttachment.php
/craft:craft what changed in this branch
```

Claude first looks for what it can delete (root rule). Then it triages all principles, loads only the skills with a signal, applies one at a time without a behavior change, and at the end runs the tests of the touched domains. It makes one triage round, one batch of fixes, and at most one confirmation round. Then it stops. The report says what changed per principle and which principles had no signal.

If the change alters the UI (component, CSS, template), the report suggests `/impeccable audit` or `/impeccable harden` on the touched files. Claude does not run the command. Without the `impeccable` skill in the session, it suggests the installation from the official site, https://impeccable.style.

For one principle only, call its skill:

```
/craft:errors app/Services/PaymentGateway.php
/craft:clean-tests tests/Feature/UploadTest.php
/craft:e2e-tests tests/e2e/
```

`/craft:e2e-tests` deletes from the E2E suite each assert that does not stop the user from reaching the goal (style, `hover`, exact text, field by field). It moves the business rule to the unit test. The loading, empty, error, and no-permission states enter when the screen has them.

## Combine with the git plugin

```
/craft:atdd reject an attachment above 10 MB
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

The hook does not detect English text written directly in the code for the user (`<button>Save</button>`). The triage of `/craft:craft` catches it through the skill `craft:i18n`. A project without i18n gets a proposal for the default library of the stack, with your approval before the installation. The same skill catches dates, numbers, and currencies formatted by hand (use `Intl`), fixed width in a text container, and `margin-left` where `margin-inline-start` fits.

## Test id on every interactive element

The `test-id` hook denies an interactive element without `data-testid` in `.vue`, `.jsx`, and `.tsx`:

| Edit | Result |
|---|---|
| `<button @click="save">Save</button>` | denied: `<button data-testid="profile-save-button" @click="save">` |
| `<Card onClick={open}>` | denied: the handler makes the component interactive |
| `` <li :data-testid="`item-${index}`"> `` | the hook allows it, but the triage of `/craft:craft` catches the index through the skill `craft:test-ids`: use the SKU |
| `<button class="btn" v-bind="$attrs">` in a `BaseButton.vue` | allowed (the test id arrives through the parent) |
| `<button>Save</button>` in `src/components/Form.test.tsx` | allowed (test file) |

The test finds the element with `getByTestId` first. Removing the attribute in the production build is optional: `/craft:setup` asks about it.

## Writing in the ASD-STE100 standard

There is no command. The `ste` hook injects the skill `craft:ste` in every session, and again after `/clear` and after compaction. From then on, replies, docs, commits, and PRs/MRs follow ASD-STE100 (Simplified Technical English, Issue 9):

| Before | After |
|---|---|
| "The verification of the config should be done by the user before the deployment is run, otherwise a failure may occur." | "Check the config before the deploy. If the config is wrong, the deploy fails." |
| "Hook config file path override" | "the path that overrides the hook configuration" |
| "You might wanna take out the old file" | "Remove the old file." |

Replies follow your language. English text follows the full standard. Text in another language follows the rules that fit any language: a sentence of at most 20 words in a procedure and 25 in a description, active voice, one imperative instruction per sentence, one term per concept, and no semicolons. Code, commands, and text pasted by the user stay as they are.

## Research before you trust

There is no command. Three hooks inject three skills in every session, and again after `/clear` and after compaction. Claude stops answering from memory:

| Skill | What Claude does |
|---|---|
| `craft:verify` | Before it uses a version, an image tag, a package name, a flag, or an API that can change, Claude looks in the documentation, the registry, the CLI, or the web. It cites the source. Without a source, it writes "not verified" |
| `craft:challenge` | Claude treats a claim of yours about a fact as wrong until a proof says it is right. If the proof contradicts you, Claude says so and shows the proof. A preference or a decision of yours is not a fact, so Claude does not challenge it |
| `craft:state-of-the-art` | Before it implements something (a Dockerfile, a CI pipeline, a framework feature), Claude looks for the official best practices and the current recommendation of the community, applies them, and cites the sources. If the practice differs from the pattern of the repo, it asks you which one to follow |

Example:

> You: "Use the `node:16` image, it is the current LTS."
> Claude: "This is not correct. Node 16 reached end of life. The current LTS is `<version>` (source: `<link>`). I use `node:<version>-slim`. Do you want to keep `node:16`?"

## A correction becomes a hook

You correct Claude (for example, "do not run `git add .env`"). Claude judges if the correction repeats, if the tool input can check it, and if the pattern is rarely wrong. If the answer is yes to all three, it proposes the hook and **waits for your approval**. Then it writes the test, the rule in TypeScript in `.claude/hooks/rules/`, and the message in `.claude/hooks/locales/en.json`, and it wires the hook in `.claude/settings.json`. If the correction needs judgment, it goes to the skill of the subject or to CLAUDE.md, not to a hook. The cheap and sure check denies at once (`PreToolUse`). The expensive or judgment check runs once at `Stop`, on the files touched in the session. To ask directly:

```
/craft:hook never commit .env
```

## Project memory

No command is required. The `memory` hook loads the skill `craft:memory` and the catalog in every session. When a conversation brings something that matters for the next one, Claude writes it in the project:

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

| Error | Example | What to do |
|---|---|---|
| It injected with a red suite | a new runner with a failure format that the hook does not know | Take the line from `~/.claude/hook-cases.jsonl`, paste it in `hooks/tests/cases.json` with `"inject": []`, and add the pattern to `FAILURE` |
| `atdd-first` denied an edit that does not change behavior | a config adjustment in a code extension | Load `/craft:atdd` anyway. If the file is not code, add the exception to `CODE_FILE` with a test in `atdd-first.test.ts` |
| `english-code` denied text that is neither user-facing text nor code | domain data (a city name in a seed) | Move the data to JSON or CSV. If a translation folder has another name, add it to `TRANSLATION_FOLDER` with a test in `english-code.test.ts` |
| `test-id` denied an element that is not interactive | a decorative anchor `<a>`, or a loose `>` in an attribute without quotes | Add the `data-testid` anyway. If the tag reading is wrong, fix `OPENING_TAG` with a test in `test-id.test.ts` |
| `filtered-tests` denied a run that is already filtered | a filter that the hook does not know | Add the filter to `FILTER_FLAG` or `TEST_PATH` with a test in `filtered-tests.test.ts` |
| `push-gate` denied the push in a project with CI | a CI with a config outside the list | Add the path to `CI_CONFIGS` with a test in `push-gate.test.ts` |
| It did not inject with a green suite | a test runner that the hook does not know | Write the case in `cases.json` with `"inject": ["refactor-on-green"]` and add the runner to `TEST_RUNNER` |

Before you change the hook, classify the finding (`craft:hook`). Real problem: fix it. False positive with evidence: make the narrowest possible exception, with the reason `"<who decided>: <evidence>"` in the commit. Doubt: ask the user once. A wide exception (a whole file, a whole rule) needs a request from the user.

The full procedure is in [turn a real case into a test](https://github.com/kamoca-labs/marketplace/blob/main/USAGE.md#turn-a-real-case-into-a-test).
