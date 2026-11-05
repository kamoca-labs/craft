import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const TOTAL = `export function orderTotal(subtotalCents: number, discountPercent: number): number {
  return subtotalCents - Math.round((subtotalCents * discountPercent) / 100)
}
`

const INVOICE = `import { orderTotal } from './total.ts'

export function invoiceLine(subtotalCents: number, discountPercent: number): string {
  return \`total: \${orderTotal(subtotalCents, discountPercent)}\`
}
`

const task: Task = {
  id: 'discount-cap',
  summary: 'a discount never takes the total below zero, and a normal discount still works',
  heldOut: true,
  prompt: 'Ticket SHOP-201: a coupon of 120% made an order total negative, and the payment provider refunded the customer. A discount must never take the total below zero.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/cart/total.ts': TOTAL,
    'src/cart/invoice.ts': INVOICE,
    'tests/total.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { orderTotal } from '../src/cart/total.ts'

test('a 25% discount', () => {
  assert.strictEqual(orderTotal(10000, 25), 7500)
})
`,
  },
  good: { 'src/cart/total.ts': TOTAL.replace('return subtotalCents - Math.round', 'return Math.max(0, subtotalCents - Math.round').replace('/ 100)\n', '/ 100))\n') },
  bad: { 'src/cart/total.ts': TOTAL.replace('discountPercent) / 100)', 'Math.min(discountPercent, 99)) / 100)') },
  async check(dir) {
    const failures: string[] = []
    const { orderTotal } = await load<{ orderTotal: (subtotal: number, percent: number) => number }>(dir, 'src/cart/total.ts')
    const { invoiceLine } = await load<{ invoiceLine: (subtotal: number, percent: number) => string }>(dir, 'src/cart/invoice.ts')
    expectEqual(failures, '120% of 100.00', orderTotal(10000, 120), 0)
    expectEqual(failures, '100% of 100.00', orderTotal(10000, 100), 0)
    expectEqual(failures, '25% of 100.00', orderTotal(10000, 25), 7500)
    expectEqual(failures, 'no discount', orderTotal(4990, 0), 4990)
    expectEqual(failures, 'invoice with 150%', invoiceLine(10000, 150), 'total: 0')
    return failures
  },
}

export default task
