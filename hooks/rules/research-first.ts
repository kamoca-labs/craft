import fs from 'node:fs'
import { addedText, blocks, deny, readInput, readTranscript, type TranscriptBlock } from '../lib.ts'

const INFRA_FILE = /(^|\/)((Dockerfile|Containerfile)[^/]*|(docker-)?compose[^/]*\.ya?ml|\.gitlab-ci\.yml|\.github\/workflows\/[^/]+\.ya?ml)$/
const INFRA_VERSION = /\bimage:\s*\S+:\S+|^\s*FROM\s+\S+:\S+|\buses:\s*\S+@\S+/m
const MANIFEST = /(^|\/)(package\.json|composer\.json|pyproject\.toml|requirements[^/]*\.txt|go\.mod|Cargo\.toml|Gemfile)$/
const MANIFEST_VERSION = /\d+\.\d+/
const VERSION_BY_FILE = [[INFRA_FILE, INFRA_VERSION], [MANIFEST, MANIFEST_VERSION]] as const
const RESEARCH_TOOL = /^(WebSearch|WebFetch|mcp__.*context7.*)$/
const REGISTRY_COMMAND = /\b((npm|pnpm) view|yarn info|composer show|pip index versions|docker manifest inspect|cargo search|go list -m)\b/

const input = readInput()

function isResearch(block: TranscriptBlock): boolean {
  if (block.type !== 'tool_use') return false
  if (RESEARCH_TOOL.test(block.name || '')) return true
  if (block.name === 'Agent') return block.input?.subagent_type === 'web-fetch'
  return block.name === 'Bash' && REGISTRY_COMMAND.test(block.input?.command || '')
}

function researched(): boolean {
  const transcriptPath = input.transcript_path || ''
  if (!fs.existsSync(transcriptPath)) return true
  return readTranscript(transcriptPath).some((entry) => blocks(entry).some(isResearch))
}

const file = input.tool_input.file_path || ''
const added = addedText(input)
const createsInfra = input.tool_name === 'Write' && INFRA_FILE.test(file)
const pinsVersion = VERSION_BY_FILE.some(([files, version]) => files.test(file) && version.test(added))

if ((createsInfra || pinsVersion) && !researched()) {
  deny('research-first', input)
}
