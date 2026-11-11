import { deny, readActiveInput, suiteRequired, testFileCount, testRunsArguments, unfiltered } from '../lib.ts'

const SMALL_SUITE = 10

function smallSuite(root: string): boolean {
  const tests = testFileCount(root)
  return tests > 0 && tests <= SMALL_SUITE
}

const input = readActiveInput()

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()

if (testRunsArguments(input.tool_input.command || '').some(unfiltered) && !smallSuite(root) && !suiteRequired(root, input.transcript_path)) {
  deny('filtered-tests', input)
}
