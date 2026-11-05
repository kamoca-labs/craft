import path from 'node:path'
import { load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `import path from 'node:path'

export function uploadPath(baseDir: string, userId: string, filename: string): string {
  return path.join(baseDir, userId, filename)
}
`

const GOOD = `import path from 'node:path'

export function uploadPath(baseDir: string, userId: string, filename: string): string {
  const userDir = path.resolve(baseDir, userId)
  const target = path.resolve(userDir, filename)
  if (!target.startsWith(userDir + path.sep)) throw new Error(\`invalid file name: \${filename}\`)
  return target
}
`

const BAD = SEED.replace('path.join(baseDir, userId, filename)', "path.join(baseDir, userId, filename.replace('../', ''))")

const task: Task = {
  id: 'upload-path',
  summary: 'keep an uploaded file inside the folder of its user',
  prompt: "Security report SEC-52: an upload with the file name '../../config/secrets.json' is written outside the uploads folder. A file must always land inside the folder of its user.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/storage/paths.ts': SEED,
    'tests/paths.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { uploadPath } from '../src/storage/paths.ts'

test('a file goes to the folder of its user', () => {
  assert.match(uploadPath('/srv/uploads', 'u1', 'report.pdf'), /uploads.u1.report\\.pdf$/)
})
`,
  },
  good: { 'src/storage/paths.ts': GOOD },
  bad: { 'src/storage/paths.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { uploadPath } = await load<{ uploadPath: (base: string, user: string, name: string) => string }>(dir, 'src/storage/paths.ts')
    const userDir = path.resolve('/srv/uploads', 'u1')
    const inside = (name: string) => {
      try {
        const result = path.resolve(uploadPath('/srv/uploads', 'u1', name))
        return result.startsWith(userDir + path.sep)
      } catch {
        return true
      }
    }
    for (const name of ['../../config/secrets.json', '....//....//etc/passwd', '/etc/passwd', '..']) {
      if (!inside(name)) failures.push(`${JSON.stringify(name)} escapes the folder of the user`)
    }
    const normal = path.resolve(uploadPath('/srv/uploads', 'u1', 'report.pdf'))
    if (normal !== path.join(userDir, 'report.pdf')) failures.push(`a normal file: expected ${path.join(userDir, 'report.pdf')}, got ${normal}`)
    return failures
  },
}

export default task
