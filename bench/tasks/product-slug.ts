import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const char = (code: number) => String.fromCodePoint(code)
const CAFE = `Caf${char(0xe9)} com Leite & P${char(0xe3)}o`
const ZOE = `  Zo${char(0xeb)} ${char(0x1f680)} Launch!  `

const SEED = `export function slugify(title: string): string {
  return title.toLowerCase().replace(/\\s+/g, '-')
}
`

const PRODUCT = `import { slugify } from '../lib/slug.ts'

export function productUrl(product: { id: number, title: string }): string {
  return \`/products/\${product.id}/\${slugify(product.title)}\`
}
`

const GOOD = `export function slugify(title: string): string {
  return title.normalize('NFD').replace(/\\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
`

const BAD = `export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
`

const task: Task = {
  id: 'product-slug',
  summary: 'product URLs with accents and symbols',
  prompt: `Ticket WEB-63: product URLs break for titles with accents or symbols. '${CAFE}' becomes '/products/7/${CAFE.toLowerCase().replaceAll(' ', '-')}'. URLs must only have a-z, 0-9 and dashes.`,
  seed: {
    'package.json': PACKAGE_JSON,
    'src/lib/slug.ts': SEED,
    'src/products/url.ts': PRODUCT,
    'tests/url.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { productUrl } from '../src/products/url.ts'

test('the url has the id and the title', () => {
  assert.strictEqual(productUrl({ id: 7, title: 'Blue Chair' }), '/products/7/blue-chair')
})
`,
  },
  good: { 'src/lib/slug.ts': GOOD },
  bad: { 'src/lib/slug.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { productUrl } = await load<{ productUrl: (product: object) => string }>(dir, 'src/products/url.ts')
    const url = (title: string) => productUrl({ id: 7, title })
    expectEqual(failures, 'accents and symbols', url(CAFE), '/products/7/cafe-com-leite-pao')
    expectEqual(failures, 'emoji and edge spaces', url(ZOE), '/products/7/zoe-launch')
    expectEqual(failures, 'repeated dashes', url('A -- B'), '/products/7/a-b')
    expectEqual(failures, 'plain title', url('Blue Chair 2'), '/products/7/blue-chair-2')
    return failures
  },
}

export default task
