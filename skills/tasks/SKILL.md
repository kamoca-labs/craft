---
name: tasks
description: Splits the request into activities with TaskCreate and sets the session goal (a META task plus the meta-goal Stop hook). The tasks hook loads this skill in every session. The user can also call it with /craft:tasks. Use it also in step 1 of craft:atdd, after the user approves the specification.
argument-hint: "[what to do]"
---

# Tasks and goal

1. With two or more actions in the request, or a new action during work in progress, create one task per action with `TaskCreate`. A request with one action (one ticket, one fix, one question) gets no task and no goal. Keep one task `in_progress`, and mark it `completed` with the result. If `TaskCreate` appears only by name, load it with `ToolSearch` (`select:TaskCreate,TaskUpdate`).
2. When you create tasks and a command can prove the result, create the `META:` task first, without asking. Take the command from the ATDD scenarios, from what the user asked ("the build passes"), or from the project scripts. The subject is `META: <measurable final state>`. The description has `Verification: ` with the filtered command between backticks and the expected result, `Constraints: ` with no test skipped, deleted, or edited to pass, and `Limit: N` (the number of tasks plus a margin).
3. The `meta-goal` hook holds the end of the turn until the goal closes. Run the verification command after the last code edit. Mark the `META:` task `completed`. End the reply with `META CLOSED: <met|cancelled by the user|limit>. <command> <result>`. Only the user can refuse the goal: `META CLOSED: refused by the user`.
4. Without the task tool, write the list and the `META:` line in the reply, and read `${CLAUDE_PLUGIN_ROOT}/skills/tasks/without-tool.md`.
