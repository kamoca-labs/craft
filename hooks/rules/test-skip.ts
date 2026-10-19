import { addedText, deny, readInput, TEST_FILE } from '../lib.ts'

const SKIPPED_OR_FOCUSED = new RegExp([
  String.raw`\b(it|test|describe|context|suite)\.(skip|only|todo)\b`,
  String.raw`\b(xit|xtest|xdescribe|xcontext|fit|fdescribe)\s*\(`,
  String.raw`\bpytest\.(mark\.)?skip`,
  String.raw`\bt\.Skip(Now|f)?\(`,
  String.raw`#\[ignore\]`,
  String.raw`\bmarkTest(Skipped|Incomplete)\b`,
  String.raw`->skip\(`,
  String.raw`@(Disabled|Ignore)\b`,
].join('|'))

const input = readInput()
const file = input.tool_input.file_path || ''

if (TEST_FILE.test(file) && SKIPPED_OR_FOCUSED.test(addedText(input))) {
  deny('test-skip', input)
}
