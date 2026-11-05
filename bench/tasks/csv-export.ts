import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export type Order = { id: string, customer: string, totalCents: number, note: string }

const HEADER = ['id', 'customer', 'total', 'note']

export function ordersToCsv(orders: Order[]): string {
  const rows = orders.map((order) => [order.id, order.customer, (order.totalCents / 100).toFixed(2), order.note])
  return [HEADER, ...rows].map((row) => row.join(',')).join('\\n')
}
`

const GOOD = SEED.replace("export function ordersToCsv", "const cell = (value: string) => (/[\",\\n]/.test(value) ? `\"${value.replaceAll('\"', '\"\"')}\"` : value)\n\nexport function ordersToCsv")
  .replace("row.join(',')", "row.map(cell).join(',')")

const BAD = SEED.replace("row.join(',')", "row.map((value) => (value.includes(',') ? `\"${value}\"` : value)).join(',')")

const task: Task = {
  id: 'csv-export',
  summary: 'escape the order export so spreadsheet columns do not break',
  prompt: "Ticket FIN-27: finance opens the order export in Excel and the columns break for customers whose name has a comma, like 'Silva, Ana'. Fix the export.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/reports/csv.ts': SEED,
    'tests/csv.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { ordersToCsv } from '../src/reports/csv.ts'

test('one line per order after the header', () => {
  const csv = ordersToCsv([{ id: '1', customer: 'Ana', totalCents: 1050, note: '' }])
  assert.strictEqual(csv, 'id,customer,total,note\\n1,Ana,10.50,')
})
`,
  },
  good: { 'src/reports/csv.ts': GOOD },
  bad: { 'src/reports/csv.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { ordersToCsv } = await load<{ ordersToCsv: (orders: object[]) => string }>(dir, 'src/reports/csv.ts')
    const line = (order: object) => ordersToCsv([order]).split(/\r?\n/).slice(1).join('\n')
    expectEqual(failures, 'plain values stay as they are', line({ id: '1', customer: 'Ana', totalCents: 1050, note: '' }), '1,Ana,10.50,')
    expectEqual(failures, 'a comma is quoted', line({ id: '2', customer: 'Silva, Ana', totalCents: 100, note: '' }), '2,"Silva, Ana",1.00,')
    expectEqual(failures, 'a quote is doubled', line({ id: '3', customer: 'Ana "Nina" Silva', totalCents: 100, note: '' }), '3,"Ana ""Nina"" Silva",1.00,')
    expectEqual(failures, 'a line break stays inside the cell', line({ id: '4', customer: 'Ana', totalCents: 100, note: 'ring\nthe bell' }), '4,Ana,1.00,"ring\nthe bell"')
    return failures
  },
}

export default task
