import { deny, readInput } from '../lib.ts'

type Segment = { text: string, quoted: string[], heredocs: string[] }

const MARK = '\u0001'
const MARKED = new RegExp(`${MARK}(\\d+)${MARK}`, 'g')
const HEREDOC_MARKER = /^<<(-?)[ \t]*(['"]?)([\w.-]+)\2/
const SAFE_TARGET = /^\/dev\/(null|stdout|stderr|tty|fd\/\d+)$/
const REDIRECT = /(?<![<>=-])>>?\|?(?![&(])[ \t]*(\S*)/g

// Commands that run another command: the program to check can be any word after them.
const WRAPPERS = new Set(['sudo', 'doas', 'env', 'time', 'nohup', 'nice', 'exec', 'command', 'timeout', 'xargs', 'find', 'docker', 'docker-compose', 'podman', 'kubectl', 'ssh'])
const PREFIXES = new Set(['sudo', 'doas', 'env', 'time', 'nohup', 'nice', 'exec', 'command', 'xargs'])
const COMMAND_POSITION_ONLY = new Set(['ed', 'ex', 'install'])

const INTERPRETER = /^(python[\d.]*|node(js)?|ruby|perl)$/
const INLINE_FLAG = /^(-[A-Za-z]*[ceE]|--eval|--print|-p)$/
const SCRIPT_FILE = /\.(py|js|mjs|cjs|rb|pl|ts)$/

const WRITE_MODE = /^[rwaxbtU+]*$/
const OPEN_CALL = /\bopen(?:Sync)?\s*\((?:[^()]|\([^()]*\))*?,\s*(?:mode\s*=\s*)?(['"])([rwaxbtU+]*)\1/g
const METHOD_OPEN = /\.open\s*\(\s*(?:mode\s*=\s*)?(['"])([rwaxbtU+]*)\1/g
const WRITER = new RegExp([
  String.raw`\bmode\s*=\s*(['"])[rwaxbtU]*[wax+][rwaxbtU+]*\1`,
  String.raw`\bopen\s*\(?[^;()]*,\s*['"]\s*(?:\+?>>?|\+<)`,
  String.raw`(?<!stdout)(?<!stderr)(?<!buffer)\.write(?:lines)?\s*\(`,
  String.raw`\.(?:write_text|write_bytes|binwrite|touch)\s*\(`,
  String.raw`\b(?:write|append)File(?:Sync)?\s*\(`,
  String.raw`\bcreateWriteStream\s*\(`,
  String.raw`\bshutil\.(?:copy|copy2|copyfile|copytree|move)\s*\(`,
  String.raw`\bos\.(?:rename|renames|replace)\s*\(`,
].join('|'))

const unmark = (text: string, segment: Segment) => text.replace(MARKED, (_, index) => segment.quoted[Number(index)])
const program = (token: string) => token.split('/').at(-1) || ''

function parse(command: string): Segment[] | null {
  const segments: Segment[] = []
  const pending: { delimiter: string, segment: Segment }[] = []
  let current: Segment = { text: '', quoted: [], heredocs: [] }
  let i = 0

  const split = () => {
    segments.push(current)
    current = { text: '', quoted: [], heredocs: [] }
  }

  const heredocEnd = (from: number, delimiter: string): [string, number] => {
    const lines: string[] = []
    let start = from
    while (start < command.length) {
      const end = command.indexOf('\n', start)
      const line = command.slice(start, end < 0 ? command.length : end)
      if (line.trim() === delimiter) return [lines.join('\n'), start + line.length]
      lines.push(line)
      if (end < 0) break
      start = end + 1
    }
    return [lines.join('\n'), command.length]
  }

  const skipSubstitution = (from: number): number => {
    let depth = 1
    let j = from
    while (j < command.length) {
      const char = command[j]
      if (char === "'") {
        const end = command.indexOf("'", j + 1)
        if (end < 0) return -1
        j = end + 1
      } else if (char === '"') {
        const read = readDouble(j)
        if (!read) return -1
        j = read[1]
      } else if (char === '\\') {
        j += 2
      } else if (char === '<' && command.startsWith('<<', j) && command[j + 2] !== '<') {
        const marker = HEREDOC_MARKER.exec(command.slice(j))
        const eol = command.indexOf('\n', j)
        if (!marker || eol < 0) return -1
        j = heredocEnd(eol + 1, marker[3])[1]
      } else {
        if (char === '(') depth++
        if (char === ')' && --depth === 0) return j + 1
        j++
      }
    }
    return -1
  }

  function readDouble(from: number): [string, number] | null {
    let j = from + 1
    while (j < command.length) {
      const char = command[j]
      if (char === '\\') j += 2
      else if (char === '"') return [command.slice(from + 1, j), j + 1]
      else if (char === '$' && command[j + 1] === '(') {
        j = skipSubstitution(j + 2)
        if (j < 0) return null
      } else if (char === '`') {
        const end = command.indexOf('`', j + 1)
        if (end < 0) return null
        j = end + 1
      } else j++
    }
    return null
  }

  const quote = (content: string) => {
    current.text += `${MARK}${current.quoted.push(content) - 1}${MARK}`
  }

  while (i < command.length) {
    const char = command[i]
    const two = command.slice(i, i + 2)
    if (char === "'") {
      const end = command.indexOf("'", i + 1)
      if (end < 0) return null
      quote(command.slice(i + 1, end))
      i = end + 1
    } else if (char === '"') {
      const read = readDouble(i)
      if (!read) return null
      quote(read[0])
      i = read[1]
    } else if (char === '`') {
      const end = command.indexOf('`', i + 1)
      if (end < 0) return null
      quote(command.slice(i + 1, end))
      i = end + 1
    } else if (char === '\\') {
      current.text += command[i + 1] === '\n' ? ' ' : '_'
      i += 2
    } else if (char === '#' && (i === 0 || /[\s;&|(]/.test(command[i - 1]))) {
      const end = command.indexOf('\n', i)
      i = end < 0 ? command.length : end
    } else if (two === '<<' && command[i + 2] !== '<') {
      const marker = HEREDOC_MARKER.exec(command.slice(i))
      if (!marker) {
        current.text += two
        i += 2
      } else {
        pending.push({ delimiter: marker[3], segment: current })
        current.text += ' '
        i += marker[0].length
      }
    } else if (char === '\n') {
      i++
      for (const { delimiter, segment } of pending.splice(0)) {
        const [body, end] = heredocEnd(i, delimiter)
        segment.heredocs.push(body)
        i = Math.min(end + 1, command.length)
      }
      split()
    } else if (two === '&&' || two === '||') {
      split()
      i += 2
    } else if (char === ';' || (char === '|' && !current.text.endsWith('>'))) {
      split()
      i++
    } else {
      current.text += char
      i++
    }
  }
  split()
  return segments
}

function redirectsToFile(segment: Segment): boolean {
  for (const match of segment.text.matchAll(REDIRECT)) {
    const target = unmark(match[1], segment).replace(/[)}]+$/, '')
    if (target && !SAFE_TARGET.test(target)) return true
  }
  return false
}

function opensForWriting(body: string): boolean {
  return [...body.matchAll(OPEN_CALL), ...body.matchAll(METHOD_OPEN)].some((match) => WRITE_MODE.test(match[2]) && /[wax+]/.test(match[2]))
}

function inlineScript(name: string, args: string[], segment: Segment, segments: Segment[]): string | null {
  if (!INTERPRETER.test(name)) return null
  if (args.includes('-')) return segments.flatMap((each) => [...each.quoted, ...each.heredocs]).join('\n')
  const inline = args.some((arg) => INLINE_FLAG.test(arg)) || (segment.heredocs.length > 0 && !args.some((arg) => SCRIPT_FILE.test(arg)))
  return inline ? [...segment.quoted, ...segment.heredocs].join('\n') : null
}

function writes(name: string, args: string[], segment: Segment, segments: Segment[]): boolean {
  const flag = (pattern: RegExp) => args.some((arg) => pattern.test(arg))
  switch (name) {
    case 'sed': return flag(/^-[A-Za-z]*i|^--in-place(=|$)/)
    case 'awk': case 'gawk': return args.some((arg, index) => (arg === '-i' || arg === '--include') && args[index + 1] === 'inplace') || flag(/^(-iinplace|--include=inplace)$/)
    case 'ed': return true
    case 'ex': return args.includes('-s')
    case 'tee': return args.some((arg) => !arg.startsWith('-') && !SAFE_TARGET.test(arg))
    case 'truncate': return args.some((arg) => !arg.startsWith('-'))
    case 'dd': return args.some((arg) => arg.startsWith('of=') && !SAFE_TARGET.test(arg.slice(3)))
    case 'install': return !flag(/^(-[A-Za-z]*d[A-Za-z]*|--directory)$/) && args.some((arg) => !arg.startsWith('-'))
  }
  const inplace = (name === 'perl' && flag(/^-[nplaFCsSwWtTuUc0-9]*i/)) || (name === 'ruby' && flag(/^-[nplaFCswWc0-9]*i/))
  const body = inlineScript(name, args, segment, segments)
  return inplace || (body !== null && (WRITER.test(body) || opensForWriting(body)))
}

function runsEditor(segment: Segment, segments: Segment[]): boolean {
  const tokens = segment.text.split(/\s+/).filter(Boolean)
  let first = 0
  while (first < tokens.length && /^[A-Za-z_]\w*=/.test(tokens[first])) first++
  if (first >= tokens.length) return false
  const scan = WRAPPERS.has(program(unmark(tokens[first], segment)))
  const last = scan ? tokens.length : first + 1
  for (let k = first; k < last; k++) {
    const name = program(unmark(tokens[k], segment))
    if (COMMAND_POSITION_ONLY.has(name) && k !== first && !PREFIXES.has(program(tokens[k - 1]))) continue
    if (writes(name, tokens.slice(k + 1).map((token) => unmark(token, segment)), segment, segments)) return true
  }
  return false
}

function editsFile(command: string): boolean {
  try {
    const segments = parse(command)
    return !!segments && segments.some((segment) => redirectsToFile(segment) || runsEditor(segment, segments))
  } catch {
    return false
  }
}

// Acts in every session. A command that it cannot interpret passes.
const input = readInput()

if (editsFile(input.tool_input.command || '')) {
  deny('no-shell-edit', input)
}
