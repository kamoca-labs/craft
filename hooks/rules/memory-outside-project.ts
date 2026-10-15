import { deny, readInput } from '../lib.ts'

const LOCAL_MEMORY = String.raw`\.claude/projects/[^/\s'"]+/memory/`
const FILE_IN_LOCAL_MEMORY = new RegExp(LOCAL_MEMORY)
const SHELL_WRITE_TO_LOCAL_MEMORY = new RegExp(String.raw`(>>?|\btee(\s+-a)?)\s*['"]?[^\s'"]*${LOCAL_MEMORY}`)

const input = readInput()
const { file_path = '', command = '' } = input.tool_input

if (FILE_IN_LOCAL_MEMORY.test(file_path) || SHELL_WRITE_TO_LOCAL_MEMORY.test(command)) {
  deny('memory-outside-project', input)
}
