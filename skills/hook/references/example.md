# Hook layout and example

Read this before you write the first hook of a project.

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
