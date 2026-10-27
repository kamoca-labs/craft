import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type HookInput = {
  tool_name?: string
  tool_input: {
    command?: string
    file_path?: string
    content?: string
    new_string?: string
    edits?: { new_string: string }[]
  }
  transcript_path?: string
  last_assistant_message?: string
  tool_response?: { stdout?: string, stderr?: string }
}

const CASES_LOG = process.env.HOOK_CASES_LOG || path.join(os.homedir(), '.claude', 'hook-cases.jsonl')
const MESSAGES: Record<string, string> = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'locales', 'pt-BR.json'), 'utf8'))

export const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|astro|php|py|go|rs|java|kt|rb|cs)$/
export const TEST_FILE = /(^|\/)(tests?|__tests__|specs?)\/|[._](test|spec)\.\w+$|(^|\/)test_[^/]+\.py$/

export const TEST_RUNNER = new RegExp([
  /\b(npx|pnpm( exec)?|bunx)\s+(vitest|jest)\b/,
  /(^|[\s;&|/])(vitest|jest|pest|phpunit|pytest)\b/,
  /\b(npm|pnpm|yarn|bun|composer)(\s+run)?\s+test\b/,
  /\bartisan\s+test\b/,
  /\bnode\s+--test\b/,
  /\b(go|cargo|mvn|gradle)\s+test\b/,
].map((pattern) => pattern.source).join('|'))

export function addedText({ tool_input }: HookInput): string {
  const edits = tool_input.edits?.map((edit) => edit.new_string) || []
  return [tool_input.content, tool_input.new_string, ...edits].filter(Boolean).join('\n')
}

export const FULL_SUITE_LOCAL = MESSAGES['consent.full-suite-local']
export const SKIP_FULL_SUITE = MESSAGES['consent.skip-full-suite']

export type TranscriptBlock = { type: string, id?: string, name?: string, text?: string, is_error?: boolean, tool_use_id?: string, input?: { file_path?: string, command?: string, subject?: string, description?: string } }
export type TranscriptEntry = { type: string, message?: { role?: string, content?: string | TranscriptBlock[] }, toolUseResult?: { answers?: Record<string, string> } }

export function blocks(entry: TranscriptEntry): TranscriptBlock[] {
  const content = entry.message?.content
  return Array.isArray(content) ? content : []
}

export function readTranscript(transcriptPath: string): TranscriptEntry[] {
  try {
    return fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
  } catch {
    return []
  }
}

export const isCodeEdit = (block: TranscriptBlock) => block.type === 'tool_use' && /^(Edit|MultiEdit|Write)$/.test(block.name || '') && CODE_FILE.test(block.input?.file_path || '')

export function consentGiven(transcriptPath: string | undefined, labels: string[]): boolean {
  const questions = new Set<string>()
  let lastEdit = -1
  let lastConsent = -1
  readTranscript(transcriptPath || '').forEach((entry, index) => {
    for (const block of blocks(entry)) {
      if (block.type === 'tool_use' && block.name === 'AskUserQuestion' && block.id) questions.add(block.id)
      if (isCodeEdit(block)) lastEdit = index
      const answered = block.type === 'tool_result' && questions.has(block.tool_use_id || '')
      if (answered && Object.values(entry.toolUseResult?.answers || {}).some((answer) => labels.includes(answer))) lastConsent = index
    }
  })
  return lastConsent > lastEdit
}

export function message(key: string, params: Record<string, string> = {}): string {
  return MESSAGES[key].replace(/\{(\w+)\}/g, (_, name) => params[name])
}

export function readInput(): HookInput {
  return JSON.parse(fs.readFileSync(0, 'utf8'))
}

export function output({ tool_response }: HookInput): string {
  return [tool_response?.stdout, tool_response?.stderr].filter(Boolean).join('\n')
}

export function skillBody(skill: string): string {
  const file = path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'skills', skill, 'SKILL.md')
  return fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n+/, '')
}

function capture(useCase: object) {
  try {
    fs.appendFileSync(CASES_LOG, `${JSON.stringify({ plugin: 'craft', origin: 'real', ...useCase })}\n`)
  } catch {}
}

export function deny(rule: string, input: HookInput): never {
  const reason = message(`deny.${rule}`)
  capture({ description: reason, tool_name: input.tool_name, tool_input: input.tool_input, deny: [rule] })
  process.stderr.write(`[craft:${rule}] ${reason}\n`)
  process.exit(2)
}

export function inject(rule: string, input: HookInput, context: string) {
  capture({
    description: message('capture.injected', { rule }),
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_response: input.tool_response,
    inject: [rule],
  })
  addContext('PostToolUse', context)
}

export function addContext(hookEventName: string, context: string) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: context } }))
}
