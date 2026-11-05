import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { CODE_FILE, inject, message, output, readInput, testRunArguments } from '../lib.ts'

const SMALL_CHANGE = 20

const FAILURE = new RegExp([
  /\b[1-9]\d* (failed|failing)\b/,
  /\bFAIL(ED)?\b/,
  /\b(FAILURES|ERRORS)!/,
  /ELIFECYCLE/,
  /No test files found/,
  /^(#|\u2139) fail [1-9]/m,
  /^\u2716 /m,
  /^not ok \d+/m,
  /^\s*[1-9]\d* fail\b/m,
  /^\(fail\) /m,
  /\b[1-9]\d* errors?\b/,
  /\bnot met\b|does not meet/,
  /^npm (error|ERR!)/m,
  /FAILURE!|Failures: [1-9]/,
  /no tests to run|Tests are skipped/,
].map((pattern) => pattern.source).join('|'), 'm')

const SUCCESS = new RegExp([
  /\b[1-9]\d* (passed|passing|pass)\b/,
  /^(#|\u2139) pass [1-9]/m,
  /\bOK \(\d+ tests?|^OK, but /m,
  /^ok\s+\S+\s+(\(cached\)|[\d.]+s)/m,
  /\bBUILD SUCCESS(FUL)?\b/,
  /^Ran [1-9]\d* tests? in [\s\S]*^OK\b/m,
  /\bPassed!\s+-\s+Failed:\s+0\b/,
  /\b[1-9]\d* examples?, 0 failures\b/,
].map((pattern) => pattern.source).join('|'), 'm')

function git(root: string, args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
}

function branchBase(root: string): string {
  for (const branch of ['origin/HEAD', 'origin/main', 'origin/master', 'main', 'master']) {
    try {
      return git(root, ['merge-base', 'HEAD', branch]).trim()
    } catch {}
  }
  return 'HEAD'
}

function changedLines(root: string): number {
  const tracked = git(root, ['diff', branchBase(root), '--numstat']).split('\n')
    .map((line) => line.split('\t'))
    .filter(([, , file]) => file && CODE_FILE.test(file))
    .reduce((sum, [added, deleted]) => sum + (Number(added) || 0) + (Number(deleted) || 0), 0)
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard']).split('\n')
    .filter((file) => CODE_FILE.test(file))
    .reduce((sum, file) => sum + fs.readFileSync(path.join(root, file), 'utf8').split('\n').length, 0)
  return tracked + untracked
}

function largeChange(root: string): boolean {
  try {
    return changedLines(root) >= SMALL_CHANGE
  } catch {
    return true
  }
}

const input = readInput()
const runOutput = output(input)

if (testRunArguments(input.tool_input.command || '') !== null && SUCCESS.test(runOutput) && !FAILURE.test(runOutput) && largeChange(process.env.CLAUDE_PROJECT_DIR || process.cwd())) {
  inject('refactor-on-green', input, message('context.refactor-on-green'))
}
