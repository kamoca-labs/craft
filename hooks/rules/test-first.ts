import { blocks, CODE_FILE, inject, isCodeEdit, message, readInput, readTranscript, TEST_FILE } from '../lib.ts'

const STYLE_LOADED = /"skill"\s*:\s*"design:style"/

const input = readInput()
const file = input.tool_input.file_path || ''

function firstProductionEditBeforeTest(transcriptPath: string): boolean {
  const entries = readTranscript(transcriptPath)
  if (entries.some((entry) => STYLE_LOADED.test(JSON.stringify(entry)))) return false
  const edits = entries.flatMap(blocks).filter(isCodeEdit).map((block) => block.input?.file_path || '')
  return !edits.some((path) => TEST_FILE.test(path)) && edits.filter((path) => path !== file).length === 0
}

if (CODE_FILE.test(file) && !TEST_FILE.test(file) && input.transcript_path && firstProductionEditBeforeTest(input.transcript_path)) {
  inject('test-first', input, message('context.test-first'))
}
