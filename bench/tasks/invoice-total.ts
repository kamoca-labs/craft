import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const MONEY = `export function formatMoney(cents: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}
`

const RECEIPT = `import { formatMoney } from '../lib/money.ts'

export type Payment = { id: string, amountCents: number }

export function receiptLine(payment: Payment): string {
  return \`Payment \${payment.id}: \${formatMoney(payment.amountCents)}\`
}
`

const SEED_INVOICE = `export type InvoiceItem = { description: string, unitCents: number, quantity: number }
export type Invoice = { id: string, customer: string, items: InvoiceItem[] }

export function invoiceSummary(invoice: Invoice): string {
  return \`Invoice #\${invoice.id} for \${invoice.customer}\`
}
`

const INVOICE = { id: '42', customer: 'Ana Silva', items: [{ description: 'Chair', unitCents: 12_990, quantity: 2 }, { description: 'Lamp', unitCents: 4_550, quantity: 1 }] }

const task: Task = {
  id: 'invoice-total',
  summary: 'show the invoice total, in the same format as the receipt',
  prompt: 'Ticket SHOP-131: the invoice summary must also show the total of the items (unit price times quantity), in the same money format that the receipt already uses.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/lib/money.ts': MONEY,
    'src/receipts/receipt.ts': RECEIPT,
    'src/invoices/invoice.ts': SEED_INVOICE,
    'tests/invoice.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { invoiceSummary } from '../src/invoices/invoice.ts'

test('the summary names the invoice and the customer', () => {
  assert.match(invoiceSummary({ id: '7', customer: 'Bruno', items: [] }), /#7 for Bruno/)
})
`,
  },
  good: {
    'src/invoices/invoice.ts': `import { formatMoney } from '../lib/money.ts'\n\n${SEED_INVOICE.replace('return `Invoice #${invoice.id} for ${invoice.customer}`', 'const total = invoice.items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0)\n  return `Invoice #${invoice.id} for ${invoice.customer}: ${formatMoney(total)}`')}`,
  },
  bad: {
    'src/invoices/invoice.ts': SEED_INVOICE.replace('return `Invoice #${invoice.id} for ${invoice.customer}`', 'const total = invoice.items.reduce((sum, item) => sum + item.unitCents * item.quantity, 0)\n  return `Invoice #${invoice.id} for ${invoice.customer}: R$ ${(total / 100).toFixed(2)}`'),
  },
  async check(dir) {
    const failures: string[] = []
    const { invoiceSummary } = await load<{ invoiceSummary: (invoice: object) => string }>(dir, 'src/invoices/invoice.ts')
    const { formatMoney } = await load<{ formatMoney: (cents: number) => string }>(dir, 'src/lib/money.ts')
    const summary = invoiceSummary(INVOICE)
    if (!summary.includes(formatMoney(30_530))) failures.push(`total: expected ${JSON.stringify(formatMoney(30_530))} in ${JSON.stringify(summary)}`)
    if (!summary.includes('#42') || !summary.includes('Ana Silva')) failures.push('the summary must keep the id and the customer')
    expectEqual(failures, 'empty invoice shows a zero total', invoiceSummary({ id: '1', customer: 'X', items: [] }).includes(formatMoney(0)), true)
    return failures
  },
}

export default task
