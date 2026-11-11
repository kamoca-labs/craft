import { projectRoot, runGate } from '../activity.ts'
import { readInput } from '../lib.ts'

const input = readInput() as ReturnType<typeof readInput> & { session_id?: string, cwd?: string }
if (!input.session_id) process.exit(0)

const output = runGate(projectRoot(input.cwd), input.session_id, input.last_assistant_message || '')
if (output) process.stdout.write(JSON.stringify(output))
