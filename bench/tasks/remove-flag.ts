import fs from 'node:fs'
import path from 'node:path'
import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const FLAGS = `export const flags = {
  legacyCheckout: false,
  newSearch: true,
}
`

const LEGACY_TAX = `export function legacyTax(subtotalCents: number, state: string): number {
  const rates: Record<string, number> = { SP: 0.18, RJ: 0.2, MG: 0.18 }
  const rate = rates[state] ?? 0.17
  return Math.round(subtotalCents * rate)
}
`

const TAX = `export function tax(subtotalCents: number, rate: number): number {
  return Math.round(subtotalCents * rate)
}
`

const SEED_TOTAL = `import { flags } from '../config/flags.ts'
import { legacyTax } from './legacy-tax.ts'
import { tax } from './tax.ts'

export type Cart = { items: { priceCents: number, quantity: number }[], state: string, taxRate: number, shippingCents: number }

export function checkoutTotal(cart: Cart): number {
  const subtotal = cart.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
  if (flags.legacyCheckout) {
    const legacyShipping = subtotal > 20_000 ? 0 : cart.shippingCents
    return subtotal + legacyTax(subtotal, cart.state) + legacyShipping
  }
  return subtotal + tax(subtotal, cart.taxRate) + cart.shippingCents
}
`

const SEARCH = `import { flags } from '../config/flags.ts'

export function searchMode(): 'new' | 'classic' {
  return flags.newSearch ? 'new' : 'classic'
}
`

const GOOD_TOTAL = `import { tax } from './tax.ts'

export type Cart = { items: { priceCents: number, quantity: number }[], state: string, taxRate: number, shippingCents: number }

export function checkoutTotal(cart: Cart): number {
  const subtotal = cart.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
  return subtotal + tax(subtotal, cart.taxRate) + cart.shippingCents
}
`

const CART = { items: [{ priceCents: 10_000, quantity: 3 }], state: 'SP', taxRate: 0.1, shippingCents: 1_500 }

const task: Task = {
  id: 'remove-flag',
  summary: 'remove a feature flag that is always off, with its code',
  prompt: 'Ticket SHOP-170: the legacy checkout was turned off 6 months ago and will not come back. Remove the legacyCheckout flag and the code that only it used.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/config/flags.ts': FLAGS,
    'src/checkout/legacy-tax.ts': LEGACY_TAX,
    'src/checkout/tax.ts': TAX,
    'src/checkout/total.ts': SEED_TOTAL,
    'src/search/mode.ts': SEARCH,
    'tests/total.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { checkoutTotal } from '../src/checkout/total.ts'

test('total is subtotal plus tax plus shipping', () => {
  assert.strictEqual(checkoutTotal({ items: [{ priceCents: 1000, quantity: 2 }], state: 'SP', taxRate: 0.1, shippingCents: 500 }), 2700)
})
`,
  },
  good: {
    'src/config/flags.ts': 'export const flags = {\n  newSearch: true,\n}\n',
    'src/checkout/total.ts': GOOD_TOTAL,
    'src/checkout/legacy-tax.ts': null,
  },
  bad: {
    'src/config/flags.ts': 'export const flags = {\n  legacyCheckout: false,\n  newSearch: true,\n}\n',
    'src/checkout/total.ts': GOOD_TOTAL,
  },
  async check(dir) {
    const failures: string[] = []
    const sources = (fs.readdirSync(path.join(dir, 'src'), { recursive: true }) as string[]).filter((file) => file.endsWith('.ts'))
    const read = (file: string) => fs.readFileSync(path.join(dir, 'src', file), 'utf8')
    if (sources.includes(path.join('checkout', 'legacy-tax.ts')) && !sources.some((file) => read(file).includes('legacy-tax'))) {
      failures.push('src/checkout/legacy-tax.ts has no user left and must be deleted')
    }
    for (const file of sources) {
      if (read(file).includes('legacyCheckout')) failures.push(`src/${file} still mentions legacyCheckout`)
    }
    const { checkoutTotal } = await load<{ checkoutTotal: (cart: object) => number }>(dir, 'src/checkout/total.ts')
    expectEqual(failures, 'the checkout total keeps the current behavior', checkoutTotal(CART), 34_500)
    const { searchMode } = await load<{ searchMode: () => string }>(dir, 'src/search/mode.ts')
    expectEqual(failures, 'the other flag keeps working', searchMode(), 'new')
    return failures
  },
}

export default task
