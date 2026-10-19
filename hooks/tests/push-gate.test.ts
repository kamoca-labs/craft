import assert from 'node:assert'
import { test } from 'node:test'
import { answer, codeEdit, FULL_SUITE_LOCAL, runRule, SKIP_FULL_SUITE } from './transcript.ts'

const bash = (command: string, transcript: string[] = [], projectFiles: string[] = []) => runRule('push-gate', { command }, transcript, projectFiles)

test('denies a push or a PR/MR without CI and without an answer', () => {
  for (const command of ['git push', 'git push -u origin feat/upload', 'gh pr create --fill', 'glab mr create --fill']) {
    const result = bash(command)
    assert.strictEqual(result.status, 2, command)
    assert.match(result.stderr, /\[craft:push-gate\].*AskUserQuestion/)
  }
})

test('allows a push or a PR/MR when the project has CI', () => {
  for (const ci of ['.github/workflows/ci.yml', '.gitlab-ci.yml', 'bitbucket-pipelines.yml', '.circleci/config.yml', 'Jenkinsfile', 'azure-pipelines.yml', '.drone.yml', '.woodpecker.yml']) {
    assert.strictEqual(bash('git push', [], [ci]).status, 0, ci)
    assert.strictEqual(bash('glab mr create --fill', [], [ci]).status, 0, ci)
  }
})

test('without CI, allows a push or a PR/MR after the user answers', () => {
  for (const label of [FULL_SUITE_LOCAL, SKIP_FULL_SUITE]) {
    assert.strictEqual(bash('git push', [answer(label)]).status, 0, label)
    assert.strictEqual(bash('gh pr create --fill', [answer(label)]).status, 0, label)
  }
})

test('without CI, an answer before the last code edit does not allow the push', () => {
  assert.strictEqual(bash('git push', [answer(SKIP_FULL_SUITE), codeEdit('src/upload.ts')]).status, 2)
})
