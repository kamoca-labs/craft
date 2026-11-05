import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export type Sale = { createdAt: Date, totalCents: number }

export function dailyTotals(sales: Sale[], timeZone: string): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const sale of sales) {
    const day = sale.createdAt.toISOString().slice(0, 10)
    totals[day] = (totals[day] ?? 0) + sale.totalCents
  }
  return totals
}
`

const GOOD = SEED.replace("const totals: Record<string, number> = {}", "const totals: Record<string, number> = {}\n  const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })")
  .replace('sale.createdAt.toISOString().slice(0, 10)', 'dayOf.format(sale.createdAt)')

const BAD = SEED.replace('sale.createdAt.toISOString().slice(0, 10)', 'new Date(sale.createdAt.getTime() - 3 * 3_600_000).toISOString().slice(0, 10)')

const sale = (iso: string, totalCents: number) => ({ createdAt: new Date(iso), totalCents })

const task: Task = {
  id: 'daily-timezone',
  summary: 'daily sales report in the time zone of the shop',
  prompt: 'Ticket FIN-31: the daily sales report puts late night sales in the next day. Each shop has its own time zone (we have shops in Brazil, the US and Portugal), and dailyTotals already receives it. The days must follow the time of the shop.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/reports/daily.ts': SEED,
    'tests/daily.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { dailyTotals } from '../src/reports/daily.ts'

test('sums the sales of one day', () => {
  const sales = [{ createdAt: new Date('2026-03-10T15:00:00Z'), totalCents: 100 }, { createdAt: new Date('2026-03-10T16:00:00Z'), totalCents: 50 }]
  assert.deepStrictEqual(dailyTotals(sales, 'UTC'), { '2026-03-10': 150 })
})
`,
  },
  good: { 'src/reports/daily.ts': GOOD },
  bad: { 'src/reports/daily.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { dailyTotals } = await load<{ dailyTotals: (sales: object[], timeZone: string) => Record<string, number> }>(dir, 'src/reports/daily.ts')
    expectEqual(failures, 'Sao Paulo, 23:30 local', dailyTotals([sale('2026-03-10T02:30:00Z', 100)], 'America/Sao_Paulo'), { '2026-03-09': 100 })
    expectEqual(failures, 'New York in summer time, 22:00 local', dailyTotals([sale('2026-07-04T02:00:00Z', 70)], 'America/New_York'), { '2026-07-03': 70 })
    expectEqual(failures, 'Lisbon in summer time, 00:30 local', dailyTotals([sale('2026-07-03T23:30:00Z', 30)], 'Europe/Lisbon'), { '2026-07-04': 30 })
    expectEqual(failures, 'UTC stays the same', dailyTotals([sale('2026-03-10T15:00:00Z', 10)], 'UTC'), { '2026-03-10': 10 })
    return failures
  },
}

export default task
