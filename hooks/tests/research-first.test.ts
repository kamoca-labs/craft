import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { SESSION, startActivity } from './helpers.ts'
import { toolUse } from './transcript.ts'

const RULE = path.join(import.meta.dirname, '..', 'rules', 'research-first.ts')

function edit(toolName: string, toolInput: object, transcript: string[] | null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const transcriptPath = path.join(dir, 'transcript.jsonl')
  if (transcript !== null) fs.writeFileSync(transcriptPath, transcript.join('\n'))
  startActivity(dir)
  return spawnSync('node', [RULE], {
    input: JSON.stringify({ tool_name: toolName, tool_input: toolInput, transcript_path: transcriptPath, session_id: SESSION }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PROJECT_DIR: dir },
  })
}

const writeDockerfile = (transcript: string[] | null) => edit('Write', { file_path: 'docker/app/Dockerfile', content: 'FROM node:24-alpine\n' }, transcript)

test('writing a Dockerfile without research in the session is denied', () => {
  const result = writeDockerfile([])

  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /^\[craft:research-first\]/)
})

const RESEARCH_SOURCES = [
  ['WebSearch', toolUse('WebSearch', { query: 'dockerfile best practices' }).line],
  ['WebFetch', toolUse('WebFetch', { url: 'https://docs.docker.com/build/building/best-practices/' }).line],
  ['Context7', toolUse('mcp__plugin_context7_context7__query-docs', { libraryId: '/docker/docs' }).line],
  ['the web-fetch agent', toolUse('Agent', { subagent_type: 'web-fetch', prompt: 'read the Docker guide' }).line],
  ['a registry command', toolUse('Bash', { command: 'npm view vitest version' }).line],
] as const

for (const [source, call] of RESEARCH_SOURCES) {
  test(`research through ${source} allows the Dockerfile`, () => {
    assert.strictEqual(writeDockerfile([call]).status, 0)
  })
}

test('adding a dependency version to package.json without research is denied', () => {
  const result = edit('Edit', { file_path: 'package.json', old_string: '"devDependencies": {', new_string: '"devDependencies": {\n    "vitest": "^3.2.0",' }, [])

  assert.strictEqual(result.status, 2)
})

test('a package.json edit without a version passes without research', () => {
  const result = edit('Edit', { file_path: 'package.json', old_string: '"scripts": {', new_string: '"scripts": {\n    "lint": "eslint .",' }, [])

  assert.strictEqual(result.status, 0)
})

test('adding an image tag to a compose file without research is denied', () => {
  const result = edit('Edit', { file_path: 'compose.yaml', old_string: '  db:', new_string: '  db:\n    image: postgres:18' }, [])

  assert.strictEqual(result.status, 2)
})

test('a compose edit that changes only a port passes without research', () => {
  const result = edit('Edit', { file_path: 'compose.yaml', old_string: '- "3000:3000"', new_string: '- "8080:3000"' }, [])

  assert.strictEqual(result.status, 0)
})

test('writing a file outside infra and manifests passes without research', () => {
  const result = edit('Write', { file_path: 'src/app.ts', content: 'export const version = "1.2.3"\n' }, [])

  assert.strictEqual(result.status, 0)
})

test('a transcript that does not exist never blocks the edit', () => {
  assert.strictEqual(writeDockerfile(null).status, 0)
})

test('hooks.json runs research-first before every edit', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'hooks.json'), 'utf8')).hooks

  const editGroup = hooks.PreToolUse.find((group: { matcher: string }) => group.matcher === 'Edit|MultiEdit|Write')

  assert.ok(editGroup.hooks.some((hook: { command: string }) => hook.command.includes('rules/research-first.ts')))
})
