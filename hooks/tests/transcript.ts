import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { SESSION, startActivity } from './helpers.ts'

let toolUseCount = 0

export function toolUse(name: string, input: object) {
  const id = `toolu_${++toolUseCount}`
  return { id, line: JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name, input }] } }) }
}

function toolResult(id: string, content: string, toolUseResult: object) {
  return JSON.stringify({ type: 'user', toolUseResult, message: { content: [{ type: 'tool_result', tool_use_id: id, content }] } })
}

export const assistantText = (text: string) => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } })

export const codeEdit = (file: string) => toolUse('Edit', { file_path: file, old_string: 'a', new_string: 'b' }).line

export function bashRun(command: string, failed = false): string {
  const use = toolUse('Bash', { command })
  const result = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: use.id, is_error: failed, content: failed ? 'Exit code 1' : 'ok' }] } })
  return [use.line, result].join('\n')
}

export const userText = (text: string) => JSON.stringify({ type: 'user', message: { content: text } })

export function runRule(rule: string, toolInput: object, transcript: string[] = [], projectFiles: string[] = [], extra: object = {}, gitRepo = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const transcriptPath = path.join(dir, 'transcript.jsonl')
  const projectDir = path.join(dir, 'project')
  fs.writeFileSync(transcriptPath, transcript.join('\n'))
  for (const file of projectFiles) {
    fs.mkdirSync(path.dirname(path.join(projectDir, file)), { recursive: true })
    fs.writeFileSync(path.join(projectDir, file), '')
  }
  fs.mkdirSync(projectDir, { recursive: true })
  startActivity(projectDir)
  if (gitRepo) spawnSync('git', ['init', '-q'], { cwd: projectDir })
  return spawnSync('node', [path.join(import.meta.dirname, '..', 'rules', `${rule}.ts`)], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: toolInput, transcript_path: transcriptPath, cwd: projectDir, session_id: SESSION, ...extra }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PROJECT_DIR: projectDir },
  })
}

const git = (cwd: string, ...args: string[]) => spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.com', ...args], { cwd, encoding: 'utf8' })

// A work repo with a bare remote. `files` is the base on main and is pushed. `ahead` is one more commit on a branch that is not pushed.
export function gitProject(files: Record<string, string>, ahead: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-git-'))
  const work = path.join(dir, 'work')
  fs.mkdirSync(work)
  git(dir, 'init', '-q', '--bare', 'remote.git')
  git(work, 'init', '-q', '-b', 'main')
  const write = (entries: Record<string, string>) => {
    for (const [file, content] of Object.entries(entries)) {
      fs.mkdirSync(path.dirname(path.join(work, file)), { recursive: true })
      fs.writeFileSync(path.join(work, file), content)
    }
  }
  write({ 'README.md': 'base', ...files })
  git(work, 'add', '-A')
  git(work, 'commit', '-q', '-m', 'base')
  git(work, 'remote', 'add', 'origin', path.join(dir, 'remote.git'))
  git(work, 'push', '-q', '-u', 'origin', 'main')
  if (Object.keys(ahead).length) {
    git(work, 'checkout', '-q', '-b', 'feat/change')
    write(ahead)
    git(work, 'add', '-A')
    git(work, 'commit', '-q', '-m', 'change')
  }
  return work
}

export function runIn(rule: string, projectDir: string, toolInput: object, transcript: string[] = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-hooks-'))
  const transcriptPath = path.join(dir, 'transcript.jsonl')
  fs.writeFileSync(transcriptPath, transcript.join('\n'))
  startActivity(projectDir)
  return spawnSync('node', [path.join(import.meta.dirname, '..', 'rules', `${rule}.ts`)], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: toolInput, transcript_path: transcriptPath, cwd: projectDir, session_id: SESSION }),
    encoding: 'utf8',
    env: { ...process.env, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PROJECT_DIR: projectDir },
  })
}
