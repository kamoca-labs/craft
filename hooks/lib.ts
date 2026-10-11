import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type HookInput = {
  tool_name?: string
  tool_input: { command?: string, file_path?: string }
  transcript_path?: string
  tool_response?: { stdout?: string, stderr?: string }
}

const CASES_LOG = process.env.HOOK_CASES_LOG || path.join(os.homedir(), '.claude', 'hook-cases.jsonl')

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

export function deny(rule: string, input: HookInput, reason: string): never {
  capture({ description: reason, tool_name: input.tool_name, tool_input: input.tool_input, deny: [rule] })
  process.stderr.write(`[craft:${rule}] ${reason}\n`)
  process.exit(2)
}

export function inject(rule: string, input: HookInput, context: string) {
  capture({
    description: `${rule} injetou contexto`,
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_response: input.tool_response,
    inject: [rule],
  })
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } }))
}
