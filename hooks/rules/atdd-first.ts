import fs from 'node:fs'
import { deny, readInput } from '../lib.ts'

const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|php|py|go|rs|java|kt|rb|cs)$/
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
  deny('atdd-first', input, 'carregue /craft:atdd antes de editar código. Se a mudança não altera comportamento, carregue a skill mesmo assim: ela diz quando o fluxo não se aplica.')
}
