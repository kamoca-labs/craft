import fs from 'node:fs'
import { CODE_FILE, deny, readInput } from '../lib.ts'

const FLOW_LOADED = /"skill":"craft:atdd"|<command-name>\/craft:atdd<\/command-name>/

const input = readInput()
const file = input.tool_input.file_path || ''

function flowLoaded(transcriptPath: string): boolean {
  try {
    return FLOW_LOADED.test(fs.readFileSync(transcriptPath, 'utf8'))
  } catch {
    return true
  }
}

if (CODE_FILE.test(file) && input.transcript_path && !flowLoaded(input.transcript_path)) {
  deny('atdd-first', input)
}
