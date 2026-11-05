# Skills architecture and migration plan

Status: in progress. Written on 2026-11-04.

| Plugin | Done | Open |
|---|---|---|
| craft | phases 1, 2 and 4 on 2026-11-05. `node scripts/skill-budget.ts`: 5 skills visible, 1,296 description characters (was 40 and 10,548). The relative link `references/dry.md` resolves in a test session | phase 0 evals (the benchmark in `bench/` measures the behavior instead), phase 5 release |
| docker | phases 1, 3 and 4 on branch `feat/progressive-disclosure`: 4 skills, 1,149 characters (was 11 and 3,921). A test session resolved `../docker/references/rules.md` from `create` | phase 0 evals, phase 5 |
| design | phases 1, 3 and 4 on branch `feat/progressive-disclosure`: 8 skills, 1,900 characters (was 16 and 2,549). The guards are in `scripts/verify.py` | phase 0 evals, phase 5 |
| git | `forge` moved to `skills/mr/references/forge.md`, descriptions cut, guards added, on branch `feat/progressive-disclosure`: 9 skills, 2,120 characters (was 10 and 2,719) | the decisions on `undo` and the CI names, phase 5 |

## 1. The problem

Each skill that Claude can invoke puts its description in the skill listing of every session. The listing has a budget. When the listing is over the budget, Claude Code drops descriptions. A skill without a description has only its name, so Claude does not know when to use it.

Facts from the official docs:

- "The budget scales at 1% of the model's context window. When the listing overflows, Claude Code drops descriptions starting with the skills you invoke least." ([skills](https://code.claude.com/docs/en/skills))
- The default of `skillListingBudgetFraction` is `0.01`. Each entry is cut at 1,536 characters (`skillListingMaxDescChars`). ([settings reference](https://code.claude.com/docs/en/settings-reference))
- `user-invocable: false` hides a skill from the `/` menu only. The description stays in context. ([skills, "Control who invokes a skill"](https://code.claude.com/docs/en/skills))
- `disable-model-invocation: true` removes the description from context. Claude cannot invoke the skill, and a subagent cannot preload it. (same page)
- `skillOverrides` does not apply to plugin skills: "Plugin skills are not affected by skillOverrides." (same page)

Measured state on 2026-11-04:

| Plugin | Skill folders | Visible to Claude | Description characters |
|---|---|---|---|
| craft (local, unreleased) | 40 | 40 | about 11,100 |
| design | 16 | 16 | about 2,800 |
| docker | 11 | 11 | about 4,100 |
| git | 12 | 10 | about 2,900 |
| home | 2 | 2 | about 600 |
| **Total** | **81** | **79** | **about 21,400** |

In a real session with these plugins and other installed plugins, about 59 skills had a name and no description. The list included `craft:verify`, `craft:memory`, `craft:setup`, `git:review` and `git:undo`.

Two more costs exist outside the listing:

- The craft SessionStart hooks inject about 18,000 characters of skill bodies (`ste`, `memory`, `tasks`, `tool`, `verify`, `challenge`, `state-of-the-art`). The same 7 skills are also in the listing, so Claude can load the same text a second time.
- Three UserPromptSubmit hooks add about 750 characters to every prompt.

## 2. The pattern: progressive disclosure

The official model has three levels ([Anthropic engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)):

1. **Metadata**: the name and the description. It is always in context. It must only tell Claude *when* to use the skill.
2. **The `SKILL.md` body**: it loads when Claude invokes the skill.
3. **Linked files**: Claude reads them "only as needed". They cost nothing until Claude reads them. ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))

So a plugin has few **entry skills** with a clear trigger. The detailed knowledge lives in **reference files** that an entry skill links.

## 3. Kinds of content and where each one goes

| Kind | Example | Where it lives | Listing cost |
|---|---|---|---|
| Entry skill: Claude or the user starts it | `craft:atdd`, `docker:create`, `git:commit` | `skills/<name>/SKILL.md` | One short description |
| User-only command: side effects, the user decides | `git:main`, `git:release` | `skills/<name>/SKILL.md` with `disable-model-invocation: true` | Zero |
| Always-on rule | `ste`, `verify`, `challenge`, `state-of-the-art`, `tool` | `rules/<name>.md`, injected by a SessionStart hook | Zero (the hook pays once per session) |
| Event rule: needed at one moment | the refactor screening when tests turn green | text that a hook injects at that event | Zero until the event |
| Knowledge that a router loads | the 23 craft principles, `docker:rules`, `design:colors`, `git:forge` | `skills/<router>/references/<name>.md` | Zero until read |

### Rules for each kind

**Entry skills**

- Keep a skill only if a user or a task can start it on its own, without a router.
- Write the description in the third person. Put the main use case first, then "Use when ...". ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))
- Keep the description at 300 characters or less. The API limit is 1,024 characters, but every character is paid in every session.
- Keep `SKILL.md` under 500 lines. ([skills](https://code.claude.com/docs/en/skills))

**User-only commands**

- Use `disable-model-invocation: true` for a command with a side effect that only the user decides: a commit to main, a release, an undo.

**Always-on rules**

- An always-on rule is not a skill. Put the text in `rules/<name>.md` and let the hook read the file.
- If the user must also call it as a command (`/craft:memory`, `/craft:tasks`), keep the skill with `disable-model-invocation: true`. The hook already gives Claude the text.

**Reference files**

- Link every reference directly from the `SKILL.md` that needs it. Do not link a reference from another reference: "Keep references one level deep from SKILL.md." ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices))
- Add a table of contents at the top of a reference with more than 100 lines. (same page)
- Give each reference one subject, so Claude reads only what the case needs.
- When several entry skills share a reference, keep it in one owner skill. The other skills link it with a relative path, for example `../craft/references/dry.md`.
- A hook message that sends Claude to knowledge gives the file path: `${CLAUDE_PLUGIN_ROOT}/skills/craft/references/test-ids.md`.

### What not to do

- Do not use `user-invocable: false` to save context. It saves nothing.
- Do not put the same text in a hook injection and in a model-visible skill.
- Do not use `disable-model-invocation: true` on a skill that a router loads with the `Skill` tool. Claude Code blocks that call.
- Do not raise `skillListingBudgetFraction` as the fix. It spends more context on every session and hides the cause. A user can use it as a short-term step.
- Do not plan on `skillOverrides` for these plugins. It does not apply to plugin skills.
- Do not preload many skills into a subagent with the `skills:` field. It injects the full body of each one. ([sub-agents](https://code.claude.com/docs/en/sub-agents))
- Do not use `paths:` to save listing budget until a test proves it. The docs do not say if a skill with `paths:` keeps its description in the listing. Status: not verified.
- Do not use `context: fork` for a knowledge skill. A fork does not see the conversation. Use it only for a long task with its own input, such as `craft:audit`.
- Do not give two skills names that compete for the same trigger. Today `git:ci`, `git:ci-cd` and `docker:ci` all match the word "CI".

## 4. Target state per plugin

| Plugin | Entry skills | User-only | Rules (hook) | References |
|---|---|---|---|---|
| craft | `atdd`, `craft`, `audit`, `hook`, `setup` | `memory`, `tasks` | `ste`, `tool`, `verify`, `challenge`, `state-of-the-art` | the other 28 skills |
| docker | `docker`, `create`, `tune`, `ci` | none | none | `rules`, `development`, `production`, `https`, `measure`, `versions`, `hot-reload` |
| design | `design`, `style`, `review`, `mockup`, `setup`, `system`, `connect`, `states` | none | none | `colors`, `contrast`, `motion`, `patterns`, `responsive`, `typography`, `figma`, `figcraft` |
| git | `commit`, `mr`, `review`, `ci`, `ci-cd`, `daily`, `split`, `sync` | `main`, `release`, `undo` | none | `forge` |
| home | `desk`, `lab` | none | none | none |

Result: 79 visible skills become about 28. With descriptions of 300 characters or less, the listing of these plugins drops from about 21,400 characters to about 8,000.

Owner of the shared references:

- **craft**: `skills/craft/references/`. The principles and the test skills (`clean-tests`, `unit-tests`, `e2e-tests`, `test-ids`) are used by `craft`, `atdd`, `audit` and `setup`. `acceptance-criteria`, `filtered-tests`, `e2e-container` and `real-world-edges` go to `skills/atdd/references/`. `hook-denied` goes to `skills/hook/references/`.
- **docker**: `skills/docker/references/`. `create` and `tune` link them.
- **design**: `skills/design/references/`. `design/references/workflow.md` already uses this pattern.
- **git**: `skills/mr/references/forge.md`. `review`, `ci`, `ci-cd`, `daily` and `release` link it.

Decisions for the user before phase 3:

- `git:undo` as a user-only command. It rewrites history, so the user should start it.
- New names for the three CI skills. For example, `git:ci` becomes `git:fix-ci`.
- Some craft knowledge has a trigger of its own: `e2e-tests`, `i18n` and `test-ids` ("when you write an E2E test"). The hooks `e2e-container`, `english-code` and `test-id` already react at that moment. The plan moves them to references and lets the hook message give the path. If the evals of phase 0 show a drop in use, keep them as entry skills.

## 5. Migration plan

Each phase is one PR/MR per plugin repo. Each phase has a check that a command proves.

### Phase 0: baseline and safety net

1. Add a script `scripts/skill-budget.ts` to each plugin. It prints the number of model-visible skills and the sum of their description characters.
2. Record the baseline in this document.
3. Write trigger evals with `claude plugin eval` for each entry skill: 3 prompts that must start the skill and 2 that must not.
4. Write one eval per moved principle. Example: the prompt "refactor this function with 6 parameters" must make Claude read `references/arguments.md`.
5. Check one technical point with a test session: a relative link such as `../craft/references/dry.md` resolves from another skill.

Check: the evals run and the baseline is recorded.

### Phase 1: quick wins, no change in behavior

1. **craft**: move the bodies of `ste`, `tool`, `verify`, `challenge` and `state-of-the-art` to `rules/<name>.md`. Change `skillBody()` to read from there. Delete the skill folders.
2. **craft**: set `disable-model-invocation: true` on `memory` and `tasks`.
3. **craft**: merge the three UserPromptSubmit reminders into one hook with one line of 200 characters or less.
4. **git**: set `disable-model-invocation: true` on `undo`, if the user approves.
5. **all**: cut each description to 300 characters or less. Start with `docker:tune` (647), `docker:ci` (479), `craft:audit` (509), `git:mr` (448) and `docker:rules` (446).

Check: the structure tests of each repo pass, and `skill-budget.ts` shows a smaller total.

### Phase 2: craft router

1. Move each principle skill to `skills/craft/references/<name>.md`. Remove the frontmatter.
2. Change the screening table of `craft:craft` from "load `craft:<x>` with the Skill tool" to "read `references/<x>.md`".
3. Update the links in `atdd`, `audit` and `setup`.
4. Change each hook message in `hooks/locales/en.json` from a skill name to the file path.
5. Add a table of contents to each reference with more than 100 lines.

Check: the full hook test suite passes, the phase 0 evals pass, and the listing of craft has 5 skills with a description.

### Phase 3: docker, design, git

Apply the same steps as phase 2 with the owners of section 4.

Check: the same as phase 2, for each plugin.

### Phase 4: guards against a return to the old state

Add to the structure test of each repo:

- every skill without `disable-model-invocation: true` is in an allowlist of entry skills
- no skill uses `user-invocable: false` without `disable-model-invocation: true`
- every description has 300 characters or less
- every file in `references/` is linked from a `SKILL.md`, and no reference links another reference
- every reference with more than 100 lines starts with a table of contents

Check: the structure tests fail when a test fixture breaks each rule.

### Phase 5: release

1. Bump the minor version of each plugin. Old skill names stop working, so write the change in `CHANGELOG.md` with the old name and its new path.
2. Remove the old `craft-code-reminder` copy from the parent folder after the release. It holds the installed 0.16.0 version and is not in the marketplace catalog.
3. Open a test session with all plugins and with `--debug`. Confirm that the log has no warning about the skill listing budget.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Claude reads a reference less often than it loaded a skill | The phase 0 evals measure it. Keep the skill if its eval fails. |
| A user or a project calls an old skill name, such as `craft:dry` | The CHANGELOG lists each old name with its new path. |
| A hook still points to an old skill name | Phase 2 updates `hooks/locales/en.json`, and phase 4 adds a test. |
| The installed 0.16.0 reads `.claude/craft.json` (`sessionSkills`, `subagentSkills`) | The local craft no longer has this feature. Confirm it was removed on purpose before the release. |
