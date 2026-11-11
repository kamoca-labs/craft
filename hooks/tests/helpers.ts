import assert from 'node:assert'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RULES = path.join(import.meta.dirname, '..', 'rules')

export type ToolRun = { command: string, stdout?: string, stderr?: string }

export const SESSION = 'test-session'

// The hooks act only while the session has an active craft activity, so each test project has one.
export function startActivity(projectDir: string, session = SESSION) {
  const dir = path.join(projectDir, '.claude', 'local', 'activities', 'test')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(projectDir, '.claude', 'local', '.gitignore'), '*\n')
  fs.writeFileSync(path.join(dir, 'index.md'), `---\nactivity: test\nsession: ${session}\nstatus: active\n---\n`)
}

export type Sandbox = {
  casesLog: string
  projectDir: string
  run: (rule: string, toolRun: ToolRun) => SpawnSyncReturns<string>
  pre: (rule: string, toolName: string, toolInput: object) => SpawnSyncReturns<string>
}

export function sandbox({ activity = true } = {}): Sandbox {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const casesLog = path.join(dir, 'cases.jsonl')
  const projectDir = path.join(dir, 'project')
  if (activity) startActivity(projectDir)
  const execute = (rule: string, input: object) =>
    spawnSync('node', [path.join(RULES, `${rule}.ts`)], {
      input: JSON.stringify({ session_id: SESSION, ...input }),
      encoding: 'utf8',
      env: {
        ...process.env,
        HOOK_CASES_LOG: casesLog,
        CLAUDE_PLUGIN_ROOT: path.join(import.meta.dirname, '..', '..'),
        CLAUDE_PROJECT_DIR: projectDir,
      },
    })
  const run = (rule: string, { command, stdout = '', stderr = '' }: ToolRun) =>
    execute(rule, { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, tool_response: { stdout, stderr } })
  const pre = (rule: string, toolName: string, toolInput: object) =>
    execute(rule, { hook_event_name: 'PreToolUse', tool_name: toolName, tool_input: toolInput })
  return { casesLog, projectDir, run, pre }
}

export function injected(result: SpawnSyncReturns<string>): string | null {
  assert.strictEqual(result.status, 0, result.stderr)
  if (!result.stdout.trim()) return null
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext
}

