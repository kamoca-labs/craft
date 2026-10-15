import fs from 'node:fs'
import path from 'node:path'
import { addContext, message, skillBody } from '../lib.ts'

const CONTEXT_LIMIT = 10_000
const CATALOG = path.join(process.env.CLAUDE_PROJECT_DIR || '', '.claude', 'memory', 'MEMORY.md')

function fit(text: string, budget: number): string {
  if (text.length <= budget) return text
  const notice = message('context.memory-truncated')
  const kept = text.slice(0, budget - notice.length)
  return `${kept.slice(0, kept.lastIndexOf('\n') + 1)}${notice}`
}

const head = `${skillBody('memory').trim()}\n\n${message('context.memory-catalog')}\n\n`
const catalog = fs.existsSync(CATALOG) ? fs.readFileSync(CATALOG, 'utf8').trim() : message('context.memory-empty')

addContext('SessionStart', head + fit(catalog, CONTEXT_LIMIT - head.length - 1))
