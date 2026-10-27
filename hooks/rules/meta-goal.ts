import { blocks, isCodeEdit, message, readInput, readTranscript, type TranscriptBlock } from '../lib.ts'

const DEFAULT_LIMIT = 6
const DECLARATION = /^META:/m
const CLOSURE = /^META CLOSED:/m
const VERIFICATION = /Verification:\s*`([^`]+)`/
const LIMIT = /Limit:\s*(\d+)/

const input = readInput()
const entries = readTranscript(input.transcript_path || '')
const assistantBlocks = entries.flatMap((entry, index) => (entry.type === 'assistant' ? blocks(entry).map((block) => ({ block, index })) : []))

const declared = (block: TranscriptBlock) =>
  (block.type === 'tool_use' && block.name === 'TaskCreate' && /^META:/.test(block.input?.subject || '')) || (block.type === 'text' && DECLARATION.test(block.text || ''))
const declarationText = (block: TranscriptBlock) => `${block.input?.subject || ''}\n${block.input?.description || ''}\n${block.text || ''}`

const declaration = assistantBlocks.filter(({ block }) => declared(block)).at(-1)
if (!declaration) process.exit(0)

const closed = assistantBlocks.some(({ block, index }) => index > declaration.index && block.type === 'text' && CLOSURE.test(block.text || ''))
const asksUser = (input.last_assistant_message || '').trim().endsWith('?')
const text = declarationText(declaration.block)
const limit = Number(text.match(LIMIT)?.[1] || DEFAULT_LIMIT)
const blocked = entries.filter((entry, index) => index > declaration.index && entry.type === 'user' && JSON.stringify(entry).includes('[craft:meta-goal]')).length
if (closed || asksUser || blocked >= limit) process.exit(0)

const command = text.match(VERIFICATION)?.[1]
const lastEdit = Math.max(-1, ...entries.flatMap((entry, index) => (blocks(entry).some(isCodeEdit) ? [index] : [])))
const failedIds = new Set(entries.flatMap((entry) => blocks(entry).filter((block) => block.type === 'tool_result' && block.is_error).map((block) => block.tool_use_id)))
const verified = !command || assistantBlocks.some(({ block, index }) =>
  index > Math.max(lastEdit, declaration.index) && block.type === 'tool_use' && block.name === 'Bash' && (block.input?.command || '').includes(command) && !failedIds.has(block.id))

const reason = verified ? message('block.meta-close') : message('block.meta-verify', { command: command || '' })
process.stdout.write(JSON.stringify({ decision: 'block', reason }))
