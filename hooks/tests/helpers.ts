import assert from 'node:assert'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RULES = path.join(import.meta.dirname, '..', 'rules')

export type ToolRun = { command: string, stdout?: string, stderr?: string }

export type Sandbox = {
  casesLog: string
  run: (rule: string, toolRun: ToolRun) => SpawnSyncReturns<string>
  start: (rule: string, source: string) => SpawnSyncReturns<string>
}

export function sandbox(): Sandbox {
  const casesLog = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-')), 'cases.jsonl')
  const execute = (rule: string, input: object) =>
    spawnSync('node', [path.join(RULES, `${rule}.ts`)], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...process.env, HOOK_CASES_LOG: casesLog, CLAUDE_PLUGIN_ROOT: path.join(import.meta.dirname, '..', '..') },
    })
  const run = (rule: string, { command, stdout = '', stderr = '' }: ToolRun) =>
    execute(rule, { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, tool_response: { stdout, stderr } })
  const start = (rule: string, source: string) => execute(rule, { hook_event_name: 'SessionStart', source })
  return { casesLog, run, start }
}

export function injected(result: SpawnSyncReturns<string>): string | null {
  assert.strictEqual(result.status, 0, result.stderr)
  if (!result.stdout.trim()) return null
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext
}
