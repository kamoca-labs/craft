import fs from 'node:fs'
import path from 'node:path'

export type Files = Record<string, string | null>

export type Task = {
  id: string
  summary: string
  prompt: string
  seed: Files
  good: Files
  bad: Files
  check: (dir: string) => Promise<string[]>
  heldOut?: boolean
}

export function writeFiles(dir: string, files: Files) {
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(dir, file)
    if (content === null) {
      fs.rmSync(target, { force: true })
      continue
    }
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
}

export async function load<T = Record<string, unknown>>(dir: string, file: string): Promise<T> {
  return import(`${path.join(dir, file)}?v=${Date.now()}`) as Promise<T>
}

export function expectEqual(failures: string[], label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) failures.push(`${label}: expected ${e}, got ${a}`)
}

export async function expectThrows(failures: string[], label: string, run: () => unknown) {
  try {
    await run()
    failures.push(`${label}: expected an error, got none`)
  } catch {}
}

export async function expectNoThrow(failures: string[], label: string, run: () => unknown) {
  try {
    await run()
  } catch (error) {
    failures.push(`${label}: unexpected error ${(error as Error).message}`)
  }
}

export const PACKAGE_JSON = JSON.stringify({ name: 'shop', private: true, type: 'module', scripts: { test: 'node --test tests/' } }, null, 2) + '\n'
