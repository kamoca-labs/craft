import { deny, readInput } from '../lib.ts'

const E2E_RUNNER = /\b(playwright\s+test|cypress\s+(run|open)|artisan\s+dusk)\b/
const IN_CONTAINER = /\bdocker(\s+compose|-compose)?\s+(run|exec)\b/

const input = readInput()
const command = input.tool_input.command || ''

if (E2E_RUNNER.test(command) && !IN_CONTAINER.test(command)) {
  deny('e2e-container', input)
}
