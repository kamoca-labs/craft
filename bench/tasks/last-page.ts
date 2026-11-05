import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export type Page<T> = { items: T[], page: number, totalPages: number, hasNext: boolean }

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalPages = Math.floor(items.length / pageSize)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, totalPages, hasNext: page < totalPages }
}
`

const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1)

const task: Task = {
  id: 'last-page',
  summary: 'fix the order list that never shows the last partial page',
  prompt: 'Ticket SHOP-140: with 45 orders and 20 orders per page, the order list stops at page 2. The last 5 orders are never shown to the customer.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/orders/pagination.ts': SEED,
    'tests/pagination.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { paginate } from '../src/orders/pagination.ts'

test('the first page has the first items', () => {
  const page = paginate([1, 2, 3, 4], 1, 2)
  assert.deepStrictEqual(page.items, [1, 2])
  assert.strictEqual(page.hasNext, true)
})
`,
  },
  good: { 'src/orders/pagination.ts': SEED.replace('Math.floor', 'Math.ceil') },
  bad: { 'src/orders/pagination.ts': SEED.replace('Math.floor(items.length / pageSize)', 'Math.floor(items.length / pageSize) + 1') },
  async check(dir) {
    const failures: string[] = []
    const { paginate } = await load<{ paginate: (items: number[], page: number, size: number) => { items: number[], totalPages: number, hasNext: boolean } }>(dir, 'src/orders/pagination.ts')
    const orders = range(45)
    expectEqual(failures, '45 orders: total pages', paginate(orders, 1, 20).totalPages, 3)
    expectEqual(failures, '45 orders: page 2 has a next page', paginate(orders, 2, 20).hasNext, true)
    expectEqual(failures, '45 orders: page 3 items', paginate(orders, 3, 20).items, range(5).map((n) => n + 40))
    expectEqual(failures, '45 orders: page 3 has no next page', paginate(orders, 3, 20).hasNext, false)
    expectEqual(failures, '40 orders: total pages', paginate(range(40), 1, 20).totalPages, 2)
    expectEqual(failures, '40 orders: page 2 has no next page', paginate(range(40), 2, 20).hasNext, false)
    return failures
  },
}

export default task
