import path from 'node:path'
import type { Task } from './task.ts'

const [taskId, dir] = process.argv.slice(2)
const task = (await import(path.join(import.meta.dirname, 'tasks', `${taskId}.ts`))).default as Task
let failures: string[]
try {
  failures = await task.check(dir)
} catch (error) {
  failures = [`check error: ${(error as Error).message}`]
}
process.stdout.write(JSON.stringify(failures))
process.exit(0)
