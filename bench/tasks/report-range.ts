import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const RANGE = `export type Sale = { at: string, cents: number }

export function salesBetween(sales: Sale[], from: string, to: string): Sale[] {
  const start = Date.parse(\`\${from}T00:00:00Z\`)
  const end = Date.parse(\`\${to}T00:00:00Z\`)
  return sales.filter((sale) => {
    const at = Date.parse(sale.at)
    return at >= start && at < end
  })
}
`

const sale = (at: string) => ({ at, cents: 100 })

const task: Task = {
  id: 'report-range',
  summary: 'the last day of the range is in the report, the next day is not',
  heldOut: true,
  prompt: 'Ticket REP-8: the sales report for 1 to 31 March (UTC) leaves out every sale of 31 March. The finance team closes the month with this report.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/reports/range.ts': RANGE,
    'tests/range.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { salesBetween } from '../src/reports/range.ts'

test('a sale in the middle of the range is in the report', () => {
  assert.strictEqual(salesBetween([{ at: '2026-03-15T10:00:00Z', cents: 100 }], '2026-03-01', '2026-03-31').length, 1)
})
`,
  },
  good: { 'src/reports/range.ts': RANGE.replace('const end = Date.parse(`${to}T00:00:00Z`)', 'const end = Date.parse(`${to}T00:00:00Z`) + 86_400_000') },
  bad: { 'src/reports/range.ts': RANGE.replace('at < end', 'at <= end') },
  async check(dir) {
    const failures: string[] = []
    const { salesBetween } = await load<{ salesBetween: (sales: { at: string }[], from: string, to: string) => { at: string }[] }>(dir, 'src/reports/range.ts')
    const days = (sales: { at: string }[]) => salesBetween(sales, '2026-03-01', '2026-03-31').map((item) => item.at)
    expectEqual(failures, 'a sale late on 31 March', days([sale('2026-03-31T23:30:00Z')]), ['2026-03-31T23:30:00Z'])
    expectEqual(failures, 'a sale at midnight on 1 April', days([sale('2026-04-01T00:00:00Z')]), [])
    expectEqual(failures, 'a sale at midnight on 1 March', days([sale('2026-03-01T00:00:00Z')]), ['2026-03-01T00:00:00Z'])
    expectEqual(failures, 'a sale on 28 February', days([sale('2026-02-28T23:59:00Z')]), [])
    return failures
  },
}

export default task
