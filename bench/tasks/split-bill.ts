import { expectEqual, expectThrows, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export function splitBill(totalCents: number, people: number): number[] {
  return Array.from({ length: people }, () => Math.round(totalCents / people))
}
`

const GOOD = `export function splitBill(totalCents: number, people: number): number[] {
  if (!Number.isInteger(people) || people < 1) throw new Error(\`invalid number of people: \${people}\`)
  const base = Math.floor(totalCents / people)
  const rest = totalCents - base * people
  return Array.from({ length: people }, (_, index) => base + (index < rest ? 1 : 0))
}
`

const BAD = `export function splitBill(totalCents: number, people: number): number[] {
  const parts = Array.from({ length: people }, () => Math.floor(totalCents / people))
  parts[0] += totalCents - parts.reduce((sum, part) => sum + part, 0)
  return parts
}
`

const task: Task = {
  id: 'split-bill',
  summary: 'split a bill in cents without losing a cent',
  prompt: 'Ticket PAY-33: when a bill of R$ 100,00 is split among 3 people we charge 3 x R$ 33,33 and lose 1 cent. The parts must always sum to the total, and the extra cents go to the first people, one cent each.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/billing/split.ts': SEED,
    'tests/split.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { splitBill } from '../src/billing/split.ts'

test('an even bill splits in equal parts', () => {
  assert.deepStrictEqual(splitBill(1000, 2), [500, 500])
})
`,
  },
  good: { 'src/billing/split.ts': GOOD },
  bad: { 'src/billing/split.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { splitBill } = await load<{ splitBill: (total: number, people: number) => number[] }>(dir, 'src/billing/split.ts')
    expectEqual(failures, '10000 among 3', splitBill(10_000, 3), [3334, 3333, 3333])
    expectEqual(failures, '10 among 4', splitBill(10, 4), [3, 3, 2, 2])
    expectEqual(failures, '0 among 2', splitBill(0, 2), [0, 0])
    expectEqual(failures, '99999 among 7 sums to the total', splitBill(99_999, 7).reduce((sum, part) => sum + part, 0), 99_999)
    await expectThrows(failures, '0 people', () => splitBill(100, 0))
    return failures
  },
}

export default task
