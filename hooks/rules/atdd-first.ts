import fs from 'node:fs'
import { CODE_FILE, deny, readInput } from '../lib.ts'

const ATDD_LOADED = /"skill":"craft:atdd"|<command-name>\/craft:atdd<\/command-name>/
const STYLE_LOADED = /"skill":"craft:style"|<command-name>\/craft:style<\/command-name>/
const UI_COMPONENT = /\.(vue|tsx|jsx|svelte|astro)$/

const input = readInput()
const file = input.tool_input.file_path || ''

function readTranscript(transcriptPath: string): string | null {
  try {
    return fs.readFileSync(transcriptPath, 'utf8')
  } catch {
    return null
  }
}

function flowLoaded(transcript: string | null): boolean {
  if (transcript === null || ATDD_LOADED.test(transcript)) return true
  return UI_COMPONENT.test(file) && STYLE_LOADED.test(transcript)
}

if (CODE_FILE.test(file) && input.transcript_path && !flowLoaded(readTranscript(input.transcript_path))) {
  deny('atdd-first', input)
}
