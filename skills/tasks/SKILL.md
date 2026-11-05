---
name: tasks
description: Splits the request into tasks with TaskCreate and sets the session goal (a META task plus the meta-goal Stop hook). The tasks hook injects the same rule in every session, so only the user calls it, with /craft:tasks.
argument-hint: "[what to do]"
disable-model-invocation: true
---

# Tasks and goal

- A request with one action gets no task and no goal. The ATDD flow is the exception: after the user approves the scenarios, create one task per scenario, plus the refactor and the passing again, and the goal. With two or more actions, create one task per action with `TaskCreate` (load it with `ToolSearch` if needed), keep one `in_progress`, and mark it `completed` with the result.
- With tasks and a command that proves the result, create the `META:` task first. Its description has `Verification: ` (the filtered command and the expected result), `Constraints: ` (no test skipped, deleted or edited to pass) and `Limit: N`.
- The `meta-goal` hook holds the end of the turn. Run the verification after the last code edit, mark `META:` completed, and end with `META CLOSED: <met|cancelled by the user|limit>. <command> <result>`.
- Without the task tool, write the list in the reply and read `${CLAUDE_PLUGIN_ROOT}/skills/tasks/without-tool.md`.
