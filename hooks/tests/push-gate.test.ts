import assert from 'node:assert'
import { test } from 'node:test'
import { bashRun, codeEdit, gitProject, runIn } from './transcript.ts'

const TESTS = { 'tests/upload.test.ts': 'test', 'src/upload.ts': 'a' }
const CODE_CHANGE = { 'src/upload.ts': 'b' }
const push = (project: string, transcript: string[] = [], command = 'git push -u origin feat/change') => runIn('push-gate', project, { command }, transcript)

test('with tests, no CI and a code change that is not green, it tells Claude to run the suite and asks nothing', () => {
  for (const command of ['git push', 'git push -u origin feat/change', 'gh pr create --fill', 'glab mr create --fill']) {
    const result = push(gitProject(TESTS, CODE_CHANGE), [], command)
    assert.strictEqual(result.status, 2, command)
    assert.match(result.stderr, /\[craft:push-gate\].*Run the full suite now/)
    assert.doesNotMatch(result.stderr, /AskUserQuestion/)
  }
})

test('with a CI that runs the suite, it passes: a local run would only repeat it', () => {
  for (const ci of ['.github/workflows/ci.yml', '.gitlab-ci.yml', 'bitbucket-pipelines.yml', '.circleci/config.yml', 'Jenkinsfile', 'azure-pipelines.yml', '.drone.yml', '.woodpecker.yml']) {
    assert.strictEqual(push(gitProject({ ...TESTS, [ci]: 'ci' }, CODE_CHANGE)).status, 0, ci)
  }
})

test('without any test in the project, it passes', () => {
  assert.strictEqual(push(gitProject({ 'src/upload.ts': 'a' }, CODE_CHANGE)).status, 0)
})

test('when the commits to push have no code change, it passes', () => {
  assert.strictEqual(push(gitProject(TESTS, { 'docs/notes.md': 'notes' })).status, 0)
  assert.strictEqual(push(gitProject(TESTS)).status, 0)
})

test('when the full suite was green after the last code edit, it passes', () => {
  assert.strictEqual(push(gitProject(TESTS, CODE_CHANGE), [codeEdit('src/upload.ts'), bashRun('npm test')]).status, 0)
})

test('a green run before the last code edit, a failed run or a filtered run does not count', () => {
  const project = gitProject(TESTS, CODE_CHANGE)
  assert.strictEqual(push(project, [bashRun('npm test'), codeEdit('src/upload.ts')]).status, 2)
  assert.strictEqual(push(project, [codeEdit('src/upload.ts'), bashRun('npm test', true)]).status, 2)
  assert.strictEqual(push(project, [codeEdit('src/upload.ts'), bashRun('node --test tests/upload.test.ts')]).status, 2)
})

test('a command that is not a push or a PR/MR passes', () => {
  assert.strictEqual(push(gitProject(TESTS, CODE_CHANGE), [], 'git status').status, 0)
})
