import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const RULE = path.join(import.meta.dirname, '..', 'rules', 'atdd-first.ts')

function edit(file: string, transcript: string | null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const transcriptPath = path.join(dir, 'transcript.jsonl')
  if (transcript !== null) fs.writeFileSync(transcriptPath, transcript)
  return spawnSync('node', [RULE], {
    input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: file }, transcript_path: transcriptPath }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl') },
  })
}

const SKILL_CALL = (skill: string) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill } }] } })
const SLASH = (command: string) => JSON.stringify({ type: 'user', message: { content: `<command-name>/${command}</command-name>` } })
const MENTION = JSON.stringify({ type: 'user', message: { content: 'follow craft:atdd, "skill":"craft:atdd"' } })

test('denies editing code without the flow loaded', () => {
  const result = edit('src/upload.ts', '')
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /\[craft:atdd-first\].*\/craft:atdd/)
})

test('allows after the model loaded craft:atdd', () => {
  assert.strictEqual(edit('src/upload.ts', SKILL_CALL('craft:atdd')).status, 0)
})

test('allows after the user typed the command', () => {
  assert.strictEqual(edit('src/upload.ts', SLASH('craft:atdd')).status, 0)
})

test('merely mentioning the skill in text does not allow', () => {
  assert.strictEqual(edit('src/upload.ts', MENTION).status, 2)
})

test('non-code file does not require the flow', () => {
  for (const file of ['README.md', 'package.json', '.env', 'docker-compose.yml', 'CLAUDE.md']) {
    assert.strictEqual(edit(file, '').status, 0, file)
  }
})

test('unreadable transcript does not block', () => {
  assert.strictEqual(edit('src/upload.ts', null).status, 0)
})
