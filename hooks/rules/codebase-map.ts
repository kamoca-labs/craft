import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { addContext, message } from '../lib.ts'

const BUDGET = 2000
const MAX_FILES = 4000
const MAX_NAMES_PER_FOLDER = 30
const FILE_HEAD_BYTES = 65_536
const SOURCE = /\.(py|js|jsx|mjs|cjs|ts|tsx|go|rs|rb|java|kt|php|swift|cs)$/
const SKIPPED_FOLDER = /(^|\/)(node_modules|\.git|dist|build|out|vendor|venv|\.venv|__pycache__|coverage|\.next|target|migrations|fixtures|tests?|__tests__|specs?)(\/|$)/
const SKIPPED_FILE = /(^|\/)(test_[^/]*|[^/]*(_test|\.test|\.spec|\.gen|\.min|\.d)\.[a-z]+)$/
const SHARED_FOLDER = /(util|helper|lib|common|shared|service|component|hook|core|model|schema|api)/i

const JVM = [/^\s*(?:public\s+|abstract\s+|final\s+|static\s+)*(?:class|interface|enum|record|trait)\s+(\w+)/gm]
const NAME_PATTERNS: Record<string, RegExp[]> = {
  py: [/^(?:async\s+)?def\s+([A-Za-z]\w*)/gm, /^class\s+([A-Za-z]\w*)/gm],
  js: [/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm, /^export\s*\{([^}]*)\}/gm],
  go: [/^func\s+(?:\([^)]*\)\s*)?([A-Z]\w*)/gm, /^type\s+([A-Z]\w*)/gm],
  rs: [/^pub\s+(?:async\s+)?(?:fn|struct|enum|trait|type)\s+(\w+)/gm],
  rb: [/^\s*(?:def|class|module)\s+([A-Za-z][\w.]*)/gm],
  jvm: JVM,
}
const LANGUAGE: Record<string, string> = {
  py: 'py', js: 'js', jsx: 'js', mjs: 'js', cjs: 'js', ts: 'js', tsx: 'js', go: 'go', rs: 'rs', rb: 'rb',
  java: 'jvm', kt: 'jvm', swift: 'jvm', cs: 'jvm', php: 'jvm',
}

function trackedFiles(root: string): string[] {
  try {
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
      .split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function walkedFiles(root: string, dir = root, depth = 0, found: string[] = []): string[] {
  if (depth > 6 || found.length > MAX_FILES) return found
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const relative = path.relative(root, path.join(dir, entry.name))
    if (entry.isDirectory() && !SKIPPED_FOLDER.test(`${relative}/`)) walkedFiles(root, path.join(dir, entry.name), depth + 1, found)
    if (entry.isFile()) found.push(relative)
  }
  return found
}

function namesIn(file: string, text: string): string[] {
  const patterns = NAME_PATTERNS[LANGUAGE[path.extname(file).slice(1)]] || []
  const names = patterns.flatMap((pattern) => [...text.matchAll(pattern)])
    .flatMap((match) => match[1].split(',').map((name) => name.trim().split(/\s+as\s+/).pop() || ''))
  return [...new Set(names.filter((name) => name && !name.startsWith('_')))]
}

function namesByFolder(root: string, files: string[]): Map<string, string[][]> {
  const folders = new Map<string, string[][]>()
  for (const file of files) {
    let text: string
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8').slice(0, FILE_HEAD_BYTES)
    } catch {
      continue
    }
    const names = namesIn(file, text)
    if (!names.length) continue
    const folder = path.dirname(file)
    folders.set(folder, [...(folders.get(folder) || []), names])
  }
  return folders
}

function folderLine(folder: string, perFile: string[][]): string {
  const namesPerFile = perFile.length > 8 ? 1 : 3
  const names = [...new Set(perFile.flatMap((fileNames) => fileNames.slice(0, namesPerFile)))]
  const listed = names.slice(0, MAX_NAMES_PER_FOLDER).join(', ')
  return `${folder === '.' ? '.' : folder}/: ${listed}${names.length > MAX_NAMES_PER_FOLDER ? ', ...' : ''}`
}

function codebaseMap(root: string): string {
  const all = trackedFiles(root)
  const files = (all.length ? all : walkedFiles(root))
    .filter((file) => SOURCE.test(file) && !SKIPPED_FOLDER.test(file) && !SKIPPED_FILE.test(file))
    .slice(0, MAX_FILES)
    .sort((a, b) => Number(SHARED_FOLDER.test(b)) - Number(SHARED_FOLDER.test(a)) || a.localeCompare(b))
  const lines: string[] = []
  let used = 0
  let skipped = 0
  for (const [folder, perFile] of namesByFolder(root, files)) {
    const line = folderLine(folder, perFile)
    if (used + line.length > BUDGET) {
      skipped++
      continue
    }
    lines.push(line)
    used += line.length + 1
  }
  if (!lines.length) return ''
  const more = skipped ? `\n${message('context.codebase-map-more', { count: String(skipped) })}` : ''
  return `${message('context.codebase-map')}\n${lines.join('\n')}${more}`
}

const map = codebaseMap(process.env.CLAUDE_PROJECT_DIR || process.cwd())
if (map) addContext('SessionStart', map)
