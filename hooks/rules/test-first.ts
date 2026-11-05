import { blocks, CODE_FILE, deny, isCodeEdit, readInput, readTranscript, TEST_FILE, TRANSLATION_FOLDER } from '../lib.ts'

const FLOW_LOADED = /"skill"\s*:\s*"(craft:atdd|design:style)"|<command-name>\/(craft:atdd|design:style)<\/command-name>/

const input = readInput()
const file = input.tool_input.file_path || ''

function testWrittenOrFlowLoaded(transcriptPath: string): boolean {
  const entries = readTranscript(transcriptPath)
  if (!entries.length) return true
  if (entries.some((entry) => FLOW_LOADED.test(JSON.stringify(entry)))) return true
  return entries.flatMap(blocks).filter(isCodeEdit).some((block) => TEST_FILE.test(block.input?.file_path || ''))
}

const production = CODE_FILE.test(file) && !TEST_FILE.test(file) && !TRANSLATION_FOLDER.test(file)

if (production && input.transcript_path && !testWrittenOrFlowLoaded(input.transcript_path)) {
  deny('test-first', input)
}
