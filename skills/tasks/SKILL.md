---
name: tasks
description: Splits the request into activities with TaskCreate and sets the session goal (a META task plus the meta-goal Stop hook). The tasks hook loads this skill in every session. The user can also call it with /craft:tasks. Use it also in step 1 of craft:atdd, after the user approves the specification.
argument-hint: "[what to do]"
---

# Tasks and goal

Every session uses tasks, and a goal when a criterion exists. The `meta-goal` hook holds the end of the turn until the goal is closed. A purely informative question gets no task and no goal.

## Tasks

1. If the request has more than one activity or step, create one task per activity with `TaskCreate`. In ATDD, after the user approves the specification, create one task per scenario, plus the refactor and the passing again.
2. If `TaskCreate` appears only by name, load its schema with `ToolSearch` (`select:TaskCreate,TaskUpdate`).
3. Keep one task in `in_progress`. Mark a task `completed` with the result of the command.
4. A new scenario in the loop means the specification changed. Ask the user for approval before you continue.
5. At the end of each step, write the command and its result in the reply.

## Goal

Find the goal criterion yourself. Do not ask. Search in this order:

1. The scenarios of the ATDD specification: the filtered command that proves them.
2. What the user asked for: "the build passes" becomes the build command.
3. The project scripts (`package.json`, `composer.json`, `Makefile`, CI): filtered test, `lint`, `build`.

If you have a criterion and `TaskCreate`, always create the `META:` task first. If no command can prove the result (text, decision, research), create only the tasks and declare no goal. Ask the user only if two criteria are possible and the choice changes the work. The subject is `META: ` plus the measurable final state. The description has these fields:

- `Verification: ` the exact filtered command between backticks and the expected result. Never the full suite.
- `Constraints: ` no test skipped, deleted, or edited to pass, plus the constraints of the activity.
- `Limit: N` hook blocks: the number of tasks plus some margin.

Only the user can refuse the goal, in the user's own words. In that case, write `META CLOSED: refused by the user`.

## Closing

When the work ends, met or not, mark the `META:` task as `completed`. End the reply with `META CLOSED: <met|cancelled by the user|limit>. <command> <result>`. The verification command must run after the last code edit.

## Without the tool

1. Write the numbered list and the `META:` line in the reply, with the same parts.
2. Ask once per session, with `AskUserQuestion`, if you can enable the tool: add `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` to `~/.claude/settings.json`.
3. With approval, copy the file to the scratchpad. Add only the variable in `env` (create the key if it is missing). Check that the JSON is still valid.
4. Test with `claude -p` in a temporary folder. Ask it to check that `TaskCreate`, `TaskUpdate`, `TaskList`, and `TaskGet` exist, without creating a task.
5. Report the result and the path of the copy. The tool appears in the next session. If the user said no or the test failed, continue with the list.
