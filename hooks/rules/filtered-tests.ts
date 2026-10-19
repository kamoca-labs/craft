import { consentGiven, deny, FULL_SUITE_LOCAL, readInput, TEST_RUNNER } from '../lib.ts'

const FILTER_FLAG = /(^|\s)(-k|-t|-run|-p|--filter|--group|--test-name-pattern|--testNamePattern|--testPathPattern|--findRelatedTests|related)(\s|=|$)|::/
const TEST_PATH = /(^|\s)(?!\.\/\.\.\.(\s|$))[^\s-]\S*(\/|\.(test|spec)\.|_test\.|Test\.php|test_)\S*/

function runnerArguments(command: string): string | null {
  const match = TEST_RUNNER.exec(command)
  if (!match) return null
  return command.slice(match.index + match[0].length).split(/\||&&|;/)[0]
}

function runsFullSuite(command: string): boolean {
  const args = runnerArguments(command)
  return args !== null && !FILTER_FLAG.test(args) && !TEST_PATH.test(args)
}

const input = readInput()

if (runsFullSuite(input.tool_input.command || '') && !consentGiven(input.transcript_path, [FULL_SUITE_LOCAL])) {
  deny('filtered-tests', input)
}
