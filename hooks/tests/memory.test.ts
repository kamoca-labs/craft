import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { sandbox, type Sandbox } from './helpers.ts'

const RULE = 'memory'
const CONTEXT_LIMIT = 10_000
const CATALOG_LINE = /^- \[Memory (\d+)\]\(project_memory-\1\.md\): one line hook for memory number \1$/

function writeCatalog(box: Sandbox, catalog: string) {
  const memoryDir = path.join(box.projectDir, '.claude', 'memory')
  fs.mkdirSync(memoryDir, { recursive: true })
  fs.writeFileSync(path.join(memoryDir, 'MEMORY.md'), catalog)
}

function sessionContext(box: Sandbox, source = 'startup'): string {
  const result = box.start(RULE, source)
  assert.strictEqual(result.status, 0, result.stderr)
  const output = JSON.parse(result.stdout).hookSpecificOutput
  assert.strictEqual(output.hookEventName, 'SessionStart', source)
  return output.additionalContext
}

test('every session source injects the memory skill and the project catalog', () => {
  const box = sandbox()
  writeCatalog(box, '- [Deploy freeze](project_deploy-freeze.md): no deploy until 2026-11-01\n')
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    const context = sessionContext(box, source)
    assert.match(context, /\.claude\/memory\//, source)
    assert.match(context, /Deploy freeze/, source)
    assert.doesNotMatch(context, /^---/, source)
  }
})

test('a project without memory gets the skill and the empty catalog notice', () => {
  const context = sessionContext(sandbox())
  assert.match(context, /\.claude\/memory\//)
  assert.match(context, /ainda não tem memória/)
})

test('a large catalog is cut at a whole line and stays under the Claude Code limit', () => {
  const box = sandbox()
  const lines = Array.from({ length: 400 }, (_, i) => `- [Memory ${i}](project_memory-${i}.md): one line hook for memory number ${i}`)
  writeCatalog(box, lines.join('\n'))
  const context = sessionContext(box)
  const catalogLines = context.split('\n').filter((line) => line.startsWith('- [Memory'))
  assert.ok(context.length < CONTEXT_LIMIT, `${context.length}`)
  assert.ok(catalogLines.length > 0 && catalogLines.length < 400, `${catalogLines.length}`)
  assert.deepStrictEqual(catalogLines.filter((line) => !CATALOG_LINE.test(line)), [])
  assert.match(context, /cortado/)
})

test('session start is not logged as a use case', () => {
  const box = sandbox()
  box.start(RULE, 'startup')
  assert.strictEqual(fs.existsSync(box.casesLog), false)
})
