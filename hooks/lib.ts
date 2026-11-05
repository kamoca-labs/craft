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
const MESSAGES: Record<string, string> = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'locales', 'en.json'), 'utf8'))

export const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte|astro|php|py|go|rs|java|kt|rb|cs)$/
export const TRANSLATION_FOLDER = /(^|\/)(lang|locales?|i18n|l10n|translations?)\//
export const TEST_FILE = /(^|\/)(tests?|__tests__|specs?)\/|[._](test|spec)\.\w+$|(^|\/)test_[^/]+\.py$/

const TEST_RUNNER = new RegExp([
  /\b(npx|pnpm( exec)?|bunx)\s+(vitest|jest|mocha)\b/,
  /(^|[\s;&|/])(vitest|jest|pest|phpunit|pytest|mocha|rspec)(?=\s|$|")/,
  /\b(npm|pnpm|yarn|bun)(\s+--?[\w-]+(\s+[^-\s]\S*)?)*\s+(run\s+)?test\b/,
  /\b(npm\s+t|composer(\s+run)?\s+test|yarn\s+workspace\s+\S+\s+(run\s+)?test)\b/,
  /\b(turbo|nx)\s+(run\s+)?test\b/,
  /\bmake\s+test\b/,
  /\bartisan\s+test\b/,
  /\bnode\s+--test\b/,
  /\bpython3?\s+-m\s+(pytest|unittest)\b/,
  /\bcargo\s+(\+\S+\s+)?(test|nextest\s+run)\b/,
  /\b(go|deno|dotnet)\s+test\b/,
  /(^|[\s;&|/])(mvnw?|gradlew?)(\s+\S+)*?\s+(test|verify)\b/,
].map((pattern) => pattern.source).join('|'))

const LAUNCHER = /^(npm|pnpm|pnpx|npx|yarn|bun|bunx|composer|php|artisan|python3?|uv|poetry|go|cargo|mvnw?|gradlew?|make|docker|podman|sh|bash|zsh|node|deno|dotnet|bundle|turbo|nx|vitest|jest|pest|phpunit|pytest|mocha|rspec)$/
const COMMAND_PREFIX = /^[\s({$"']*((\w+=\S*|env|sudo|time|exec)\s+)*/
const SETUP = /\b(npm|pnpm|yarn|bun|composer|uv|poetry)\s+(install|i|add|ci|require|remove|uninstall|update|upgrade)\b|\s--(help|version)\b|\s-[hV](\s|$)/
const SEGMENT = /&&|\|\||[;|\n]/

const HEREDOC = /<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?(\n\s*\2\s*(\n|$)|$)/g
const QUOTED = /(\s-\w*c\s+)?('[^']*'|"(?:\\.|[^"\\])*")/g

export function shellCode(command: string): string {
  return command.replace(HEREDOC, '\n').replace(QUOTED, (quoted, shellFlag) => (shellFlag || !/\s/.test(quoted) ? quoted : "''"))
}

export function testRunArguments(command: string): string | null {
  for (const segment of shellCode(command).split(SEGMENT)) {
    const program = segment.replace(COMMAND_PREFIX, '').split(/\s/)[0].split('/').at(-1) || ''
    const match = LAUNCHER.test(program) && !SETUP.test(segment) ? TEST_RUNNER.exec(segment) : null
    if (match) return segment.slice(match.index + match[0].length)
  }
  return null
}

export function addedText({ tool_input }: HookInput): string {
  const edits = tool_input.edits?.map((edit) => edit.new_string) || []
  return [tool_input.content, tool_input.new_string, ...edits].filter(Boolean).join('\n')
}

export const FULL_SUITE_LOCAL = MESSAGES['consent.full-suite-local']
export const SKIP_FULL_SUITE = MESSAGES['consent.skip-full-suite']

export type TranscriptBlock = { type: string, id?: string, name?: string, text?: string, is_error?: boolean, tool_use_id?: string, input?: { file_path?: string, command?: string, subject?: string, description?: string, subagent_type?: string } }
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
  return withPluginRoot(MESSAGES[key]).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match)
}

export function readInput(): HookInput {
  return JSON.parse(fs.readFileSync(0, 'utf8'))
}

export function output({ tool_response }: HookInput): string {
  return [tool_response?.stdout, tool_response?.stderr].filter(Boolean).join('\n')
}

function withPluginRoot(text: string): string {
  return text.replaceAll('${CLAUDE_PLUGIN_ROOT}', process.env.CLAUDE_PLUGIN_ROOT || '')
}

export function ruleBody(rule: string): string {
  return withPluginRoot(fs.readFileSync(path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'rules', `${rule}.md`), 'utf8'))
}

export function skillBody(skill: string): string {
  const file = path.join(process.env.CLAUDE_PLUGIN_ROOT || '', 'skills', skill, 'SKILL.md')
  return withPluginRoot(fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n+/, ''))
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
