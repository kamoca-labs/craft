import { blocks, CODE_FILE, deny, isCodeEdit, readActiveInput, readTranscript, TEST_FILE, TRANSLATION_FOLDER } from '../lib.ts'

const FLOWS = new Set(['craft:craft', 'design:style'])
const USER_FLOW = /^<command-name>\/(craft:craft|design:style)<\/command-name>/

const input = readActiveInput()
const file = input.tool_input.file_path || ''

function testWrittenOrFlowLoaded(transcriptPath: string): boolean {
  const entries = readTranscript(transcriptPath)
  if (!entries.length) return true
  const failed = new Set(entries.flatMap(blocks).filter((block) => block.type === 'tool_result' && block.is_error).map((block) => block.tool_use_id))
  for (const entry of entries) {
    if (entry.type === 'user' && typeof entry.message?.content === 'string' && USER_FLOW.test(entry.message.content)) return true
    if (entry.type !== 'assistant') continue
    for (const block of blocks(entry)) {
      if (failed.has(block.id)) continue
      if (block.type === 'tool_use' && block.name === 'Skill' && FLOWS.has(block.input?.skill || '')) return true
      if (isCodeEdit(block) && TEST_FILE.test(block.input?.file_path || '')) return true
    }
  }
  return false
}

const production = CODE_FILE.test(file) && !TEST_FILE.test(file) && !TRANSLATION_FOLDER.test(file)

if (production && input.transcript_path && !testWrittenOrFlowLoaded(input.transcript_path)) {
  deny('test-first', input)
}
