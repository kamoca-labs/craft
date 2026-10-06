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
}

export function sandbox(): Sandbox {
  const casesLog = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-')), 'cases.jsonl')
  const run = (rule: string, { command, stdout = '', stderr = '' }: ToolRun) =>
    spawnSync('node', [path.join(RULES, `${rule}.ts`)], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, tool_response: { stdout, stderr } }),
      encoding: 'utf8',
      env: { ...process.env, HOOK_CASES_LOG: casesLog, CLAUDE_PLUGIN_ROOT: path.join(import.meta.dirname, '..', '..') },
    })
  return { casesLog, run }
}

export function injected(result: SpawnSyncReturns<string>): string | null {
  assert.strictEqual(result.status, 0, result.stderr)
  if (!result.stdout.trim()) return null
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext
}
