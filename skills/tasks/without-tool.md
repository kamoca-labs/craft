# Without the task tool

1. Write the numbered list and the `META:` line in the reply, with the same parts.
2. Ask once per session, with `AskUserQuestion`, if you can enable the tool: add `"env": { "CLAUDE_CODE_ENABLE_TODO_TOOLS": "1" }` to `~/.claude/settings.json`.
3. With approval, copy the file to the scratchpad. Add only the variable in `env` (create the key if it is missing). Check that the JSON is still valid.
4. Test with `claude -p` in a temporary folder. Ask it to check that `TaskCreate`, `TaskUpdate`, `TaskList`, and `TaskGet` exist, without creating a task.
5. Report the result and the path of the copy. The tool appears in the next session. If the user said no or the test failed, continue with the list.
