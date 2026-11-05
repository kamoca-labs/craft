import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const I18N = `import { en } from './locales/en.ts'

export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = (en as Record<string, string>)[key] ?? key
  return text.replace(/\\{(\\w+)\\}/g, (_, name) => String(params[name]))
}
`

const SEED_ATTACHMENTS = `import { t } from './i18n.ts'

export type Attachment = { name: string, size: number, type: string }

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

export function validateAttachment(file: Attachment): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return t('attachment.invalidType')
  return null
}
`

const task: Task = {
  id: 'attachment-limit',
  summary: 'reject attachments above 10 MB, with the limit in the message',
  prompt: 'Ticket SHOP-112: attachments above 10 MB must be rejected with a clear message that states the limit. Today a 40 MB PDF goes through and breaks the upload worker.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/i18n.ts': I18N,
    'src/locales/en.ts': `export const en = {\n  'attachment.invalidType': 'Only PDF, PNG and JPEG files are accepted.',\n}\n`,
    'src/attachments.ts': SEED_ATTACHMENTS,
    'tests/attachments.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { validateAttachment } from '../src/attachments.ts'

test('rejects a file type outside the list', () => {
  assert.match(validateAttachment({ name: 'a.exe', size: 10, type: 'application/x-msdownload' })!, /PDF/)
})

test('accepts a small PDF', () => {
  assert.strictEqual(validateAttachment({ name: 'a.pdf', size: 1000, type: 'application/pdf' }), null)
})
`,
  },
  good: {
    'src/locales/en.ts': `export const en = {\n  'attachment.invalidType': 'Only PDF, PNG and JPEG files are accepted.',\n  'attachment.tooLarge': 'The file is larger than {max} MB.',\n}\n`,
    'src/attachments.ts': SEED_ATTACHMENTS.replace("const ALLOWED_TYPES", "const MAX_SIZE_MB = 10\nconst ALLOWED_TYPES")
      .replace('  return null', "  if (file.size > MAX_SIZE_MB * 1024 * 1024) return t('attachment.tooLarge', { max: MAX_SIZE_MB })\n  return null"),
  },
  bad: {
    'src/attachments.ts': SEED_ATTACHMENTS.replace('  return null', "  if (file.size > 10 * 1024 * 1024) return 'File too large'\n  return null"),
  },
  async check(dir) {
    const failures: string[] = []
    const { validateAttachment } = await load<{ validateAttachment: (file: object) => string | null }>(dir, 'src/attachments.ts')
    const pdf = (size: number) => validateAttachment({ name: 'a.pdf', size, type: 'application/pdf' })
    expectEqual(failures, '9 MB passes', pdf(9_000_000), null)
    expectEqual(failures, 'exactly 10,000,000 bytes passes', pdf(10_000_000), null)
    const tooLarge = pdf(40_000_000)
    if (typeof tooLarge !== 'string' || !/10/.test(tooLarge)) failures.push(`40 MB: expected a message with the limit 10, got ${JSON.stringify(tooLarge)}`)
    const wrongType = validateAttachment({ name: 'a.exe', size: 10, type: 'application/x-msdownload' })
    if (!wrongType || wrongType === tooLarge) failures.push('the type error must stay and differ from the size error')
    return failures
  },
}

export default task
