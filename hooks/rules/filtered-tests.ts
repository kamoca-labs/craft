import { execFileSync } from 'node:child_process'
import { consentGiven, deny, FULL_SUITE_LOCAL, readInput, TEST_FILE, testRunArguments } from '../lib.ts'

const SMALL_SUITE = 10

const FILTER_FLAG = /(^|\s)(-k|-t|-run|-p(?!\s+(\d|no:))|--filter|--group|--grep|--tests|-Dtest|--test-name-pattern|--testNamePattern|--testPathPattern|--findRelatedTests|related)(\s|=|$)|::/
const VALUE_FLAG = /^(-c|--config|--configuration|--rootdir|--root)$/
const REDIRECT = /^\d*[<>]/
const TEST_ROOT = /^(\.\/)?(tests?|specs?|__tests__)\/?$/
const PATH_LIKE = /\/|\.(test|spec)\.|_test\.|_spec\.|Test\.php|test_/

function isTestPath(token: string, previous = '') {
  return !/^[-'"]/.test(token) && !REDIRECT.test(token) && !REDIRECT.test(previous) && !VALUE_FLAG.test(previous) &&
    token !== './...' && !TEST_ROOT.test(token) && PATH_LIKE.test(token)
}

function runsFullSuite(command: string): boolean {
  const args = testRunArguments(command)
  if (args === null || FILTER_FLAG.test(args)) return false
  const tokens = args.trim().split(/\s+/)
  return !tokens.some((token, index) => isTestPath(token.replace(/^['"]|['"]$/g, ''), tokens[index - 1]))
}

function smallSuite(root: string): boolean {
  try {
    const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
    const tests = files.split('\n').filter((file) => TEST_FILE.test(file)).length
    return tests > 0 && tests <= SMALL_SUITE
  } catch {
    return false
  }
}

const input = readInput()

if (runsFullSuite(input.tool_input.command || '') && !smallSuite(process.env.CLAUDE_PROJECT_DIR || process.cwd()) && !consentGiven(input.transcript_path, [FULL_SUITE_LOCAL])) {
  deny('filtered-tests', input)
}
