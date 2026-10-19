import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const write = (file: string, content: string) => sandbox().pre('test-skip', 'Write', { file_path: file, content })

test('denies a skipped or focused test in any test runner', () => {
  const cases = [
    ['src/upload.test.ts', "it.skip('rejects large files', () => {})"],
    ['src/upload.spec.ts', "describe.only('upload', () => {})"],
    ['src/upload.test.ts', "test.todo('rejects large files')"],
    ['src/upload.test.js', "xit('rejects large files', () => {})"],
    ['src/upload.test.js', "xdescribe('upload', () => {})"],
    ['src/upload.test.js', "xtest('rejects large files', () => {})"],
    ['src/upload.test.js', "fit('rejects large files', () => {})"],
    ['src/upload.test.js', "fdescribe('upload', () => {})"],
    ['tests/test_upload.py', '@pytest.mark.skip(reason="flaky")'],
    ['tests/test_upload.py', 'pytest.skip("later")'],
    ['pkg/upload_test.go', 't.Skip("later")'],
    ['tests/upload.rs', '#[ignore]'],
    ['tests/Feature/UploadTest.php', '$this->markTestSkipped();'],
    ['tests/Feature/UploadTest.php', '$this->markTestIncomplete();'],
    ['tests/Feature/UploadTest.php', "it('rejects large files', function () {})->skip();"],
    ['app/src/test/java/UploadTest.java', '@Disabled'],
    ['app/src/test/java/UploadTest.java', '@Ignore'],
  ]
  for (const [file, content] of cases) {
    const result = write(file, content)
    assert.strictEqual(result.status, 2, content)
    assert.match(result.stderr, /\[craft:test-skip\]/)
  }
})

test('allows the same text outside test files', () => {
  assert.strictEqual(write('src/list.ts', 'const page = items.skip(2)').status, 0)
})

test('only the new text is checked, so editing a test file with a legacy skip passes', () => {
  const result = sandbox().pre('test-skip', 'Edit', { file_path: 'src/upload.test.ts', old_string: "it.skip('old', () => {})", new_string: "it('old', () => {})" })
  assert.strictEqual(result.status, 0)
})
