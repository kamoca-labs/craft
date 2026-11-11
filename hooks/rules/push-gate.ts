import { deny, readActiveInput, suiteRequired } from '../lib.ts'

const PUSH_OR_REVIEW = /\b(git\s+push|gh\s+pr\s+create|glab\s+mr\s+create)\b/

const input = readActiveInput()

if (PUSH_OR_REVIEW.test(input.tool_input.command || '') && suiteRequired(process.env.CLAUDE_PROJECT_DIR || process.cwd(), input.transcript_path)) {
  deny('push-gate', input)
}
