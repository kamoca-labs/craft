import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const RULE = path.join(import.meta.dirname, '..', 'rules', 'english-code.ts')
const PORTUGUESE_LABEL = "const label = 'Usu\u00e1rio n\u00e3o encontrado'"
const PORTUGUESE_IDENTIFIER = 'function calcularPre\u00e7o() {}'
const RUSSIAN_COMMENT = '// \u043f\u0440\u0438\u0432\u0435\u0442'
const ENGLISH_CODE = "const label = t('user.notFound')"

function runTool(toolName: string, toolInput: object) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  return spawnSync('node', [RULE], {
    input: JSON.stringify({ tool_name: toolName, tool_input: toolInput }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PLUGIN_ROOT: path.join(import.meta.dirname, '..', '..') },
  })
}

const write = (file: string, content: string) => runTool('Write', { file_path: file, content })
const edit = (file: string, newString: string) => runTool('Edit', { file_path: file, old_string: 'x', new_string: newString })

test('denies non-English text written to a code file', () => {
  const result = write('src/user.ts', PORTUGUESE_LABEL)
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /\[craft:english-code\].*i18n/)
})

test('denies non-English identifiers and comments in any script', () => {
  assert.strictEqual(edit('app/Price.php', PORTUGUESE_IDENTIFIER).status, 2)
  assert.strictEqual(edit('src/greeting.py', RUSSIAN_COMMENT).status, 2)
})

test('denies non-English text in any edit of a MultiEdit', () => {
  const edits = [{ old_string: 'a', new_string: ENGLISH_CODE }, { old_string: 'b', new_string: PORTUGUESE_LABEL }]
  assert.strictEqual(runTool('MultiEdit', { file_path: 'src/App.vue', edits }).status, 2)
})

test('allows English code', () => {
  assert.strictEqual(write('src/user.ts', ENGLISH_CODE).status, 0)
  assert.strictEqual(edit('src/user.ts', ENGLISH_CODE).status, 0)
})

test('allows native-language text inside translation folders', () => {
  for (const file of ['lang/pt_BR/user.php', 'resources/lang/pt_BR/auth.php', 'src/locales/pt-BR.ts', 'src/i18n/pt.js', 'translations/messages.pt.php', 'app/l10n/pt.py']) {
    assert.strictEqual(write(file, PORTUGUESE_LABEL).status, 0, file)
  }
})

test('allows native-language text in files that are not code', () => {
  for (const file of ['README.md', 'src/locales/pt-BR.json', 'config/messages.yml', 'locale/pt_BR/LC_MESSAGES/django.po']) {
    assert.strictEqual(write(file, PORTUGUESE_LABEL).status, 0, file)
  }
})

test('allows native-language test names and test data in test files', () => {
  const testFiles = [
    'backend/tests/Feature/V1/FeedbackTest.php',
    'frontend/test/feedback-form.spec.ts',
    'src/user.test.ts',
    'src/__tests__/user.ts',
    'app/src/test/java/UserTest.java',
    'tests/test_user.py',
    'pkg/user_test.go',
    'spec/models/user_spec.rb',
  ]
  for (const file of testFiles) {
    assert.strictEqual(write(file, PORTUGUESE_LABEL).status, 0, file)
  }
})

test('still denies non-English text in source files whose name only mentions a test', () => {
  for (const file of ['src/testing.ts', 'app/Support/TestData.php', 'src/latest.ts']) {
    assert.strictEqual(write(file, PORTUGUESE_LABEL).status, 2, file)
  }
})

test('only the new text is checked, so editing a legacy file in English passes', () => {
  const result = runTool('Edit', { file_path: 'src/legacy.ts', old_string: PORTUGUESE_LABEL, new_string: ENGLISH_CODE })
  assert.strictEqual(result.status, 0)
})
