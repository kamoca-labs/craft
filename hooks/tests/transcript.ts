import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const FULL_SUITE_LOCAL = 'Rodar a suíte completa local'
export const SKIP_FULL_SUITE = 'Seguir sem a suíte completa'

let toolUseCount = 0

function toolUse(name: string, input: object) {
  const id = `toolu_${++toolUseCount}`
  return { id, line: JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } }) }
}

function toolResult(id: string, content: string, toolUseResult: object) {
  return JSON.stringify({ type: 'user', toolUseResult, message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } })
}

export function answer(label: string): string {
  const question = 'Rodo a suíte completa local antes do push?'
  const use = toolUse('AskUserQuestion', { questions: [{ question, options: [{ label: FULL_SUITE_LOCAL }, { label: SKIP_FULL_SUITE }] }] })
  return [use.line, toolResult(use.id, `Your questions have been answered: "${question}"="${label}".`, { answers: { [question]: label } })].join('\n')
}

export function bashOutput(stdout: string): string {
  const use = toolUse('Bash', { command: `echo '${stdout}'` })
  return [use.line, toolResult(use.id, stdout, { stdout, stderr: '' })].join('\n')
}

export const assistantText = (text: string) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } })

export const codeEdit = (file: string) => toolUse('Edit', { file_path: file, old_string: 'a', new_string: 'b' }).line

export const taskCreate = (subject: string, description: string) => toolUse('TaskCreate', { subject, description }).line

export function bashRun(command: string, failed = false): string {
  const use = toolUse('Bash', { command })
  const result = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: use.id, is_error: failed, content: failed ? 'Exit code 1' : 'ok' }] } })
  return [use.line, result].join('\n')
}

export const userText = (text: string) => JSON.stringify({ type: 'user', message: { content: text } })

export function runRule(rule: string, toolInput: object, transcript: string[] = [], projectFiles: string[] = [], extra: object = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const transcriptPath = path.join(dir, 'transcript.jsonl')
  const projectDir = path.join(dir, 'project')
  fs.writeFileSync(transcriptPath, transcript.join('\n'))
  for (const file of projectFiles) {
    fs.mkdirSync(path.dirname(path.join(projectDir, file)), { recursive: true })
    fs.writeFileSync(path.join(projectDir, file), '')
  }
  fs.mkdirSync(projectDir, { recursive: true })
  return spawnSync('node', [path.join(import.meta.dirname, '..', 'rules', `${rule}.ts`)], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: toolInput, transcript_path: transcriptPath, cwd: projectDir, ...extra }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PROJECT_DIR: projectDir },
  })
}
