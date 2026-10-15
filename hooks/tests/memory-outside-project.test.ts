import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const RULE = 'memory-outside-project'
const LOCAL_MEMORY = '/Users/dev/.claude/projects/-Users-dev-app/memory'

test('denies writing a memory file to the local auto memory', () => {
  for (const tool of ['Write', 'Edit', 'MultiEdit']) {
    for (const file of ['feedback_testing.md', 'MEMORY.md']) {
      const result = sandbox().pre(RULE, tool, { file_path: `${LOCAL_MEMORY}/${file}` })
      assert.strictEqual(result.status, 2, `${tool} ${file}`)
      assert.match(result.stderr, /\[craft:memory-outside-project\].*\.claude\/memory\//)
    }
  }
})

test('denies a shell write into the local auto memory', () => {
  const commands = [
    `cat > ${LOCAL_MEMORY}/feedback_testing.md <<'EOF'\nfact\nEOF`,
    `echo '- [Fact](fact.md): hook' >> ~/.claude/projects/app/memory/MEMORY.md`,
    `printf 'fact' | tee "$HOME/.claude/projects/app/memory/fact.md"`,
    `printf 'fact' | tee -a ~/.claude/projects/app/memory/MEMORY.md`,
  ]
  for (const command of commands) {
    assert.strictEqual(sandbox().pre(RULE, 'Bash', { command }).status, 2, command)
  }
})

test('allows memory inside the project', () => {
  const box = sandbox()
  for (const file of [path.join(box.projectDir, '.claude', 'memory', 'feedback_testing.md'), '.claude/memory/MEMORY.md']) {
    assert.strictEqual(box.pre(RULE, 'Write', { file_path: file }).status, 0, file)
  }
  const command = `echo '- [Fact](fact.md): hook' >> .claude/memory/MEMORY.md`
  assert.strictEqual(box.pre(RULE, 'Bash', { command }).status, 0)
})

test('allows reading and removing the local memory after moving it to the project', () => {
  for (const command of [`cat ${LOCAL_MEMORY}/MEMORY.md`, `rm ${LOCAL_MEMORY}/feedback_testing.md`, `ls ~/.claude/projects/app/memory/ > /dev/null`]) {
    assert.strictEqual(sandbox().pre(RULE, 'Bash', { command }).status, 0, command)
  }
})

test('allows other files under ~/.claude', () => {
  for (const file of ['/Users/dev/.claude/CLAUDE.md', '/Users/dev/.claude/projects/-Users-dev-app/session.jsonl']) {
    assert.strictEqual(sandbox().pre(RULE, 'Write', { file_path: file }).status, 0, file)
  }
})

test('the denial is logged as a use case', () => {
  const box = sandbox()
  box.pre(RULE, 'Write', { file_path: `${LOCAL_MEMORY}/MEMORY.md` })
  const useCase = JSON.parse(fs.readFileSync(box.casesLog, 'utf8'))
  assert.deepStrictEqual(useCase.deny, [RULE])
})
