import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const REPO = `export type Order = { id: string, customerId: string, totalCents: number }

export function createOrderRepository() {
  const orders: Order[] = []
  return {
    orders,
    async insert(data: Omit<Order, 'id'>): Promise<Order> {
      await new Promise((resolve) => setTimeout(resolve, 5))
      const order = { id: \`ord-\${orders.length + 1}\`, ...data }
      orders.push(order)
      return order
    },
  }
}
`

const SEED = `import type { Order } from './repository.ts'

type Repository = { insert(data: Omit<Order, 'id'>): Promise<Order> }
export type NewOrder = { customerId: string, totalCents: number, idempotencyKey: string }

export function createOrderService(repository: Repository) {
  return {
    async createOrder({ customerId, totalCents }: NewOrder): Promise<Order> {
      return repository.insert({ customerId, totalCents })
    },
  }
}
`

const GOOD = `import type { Order } from './repository.ts'

type Repository = { insert(data: Omit<Order, 'id'>): Promise<Order> }
export type NewOrder = { customerId: string, totalCents: number, idempotencyKey: string }

export function createOrderService(repository: Repository) {
  const byKey = new Map<string, Promise<Order>>()
  return {
    createOrder({ customerId, totalCents, idempotencyKey }: NewOrder): Promise<Order> {
      if (!byKey.has(idempotencyKey)) byKey.set(idempotencyKey, repository.insert({ customerId, totalCents }))
      return byKey.get(idempotencyKey)!
    },
  }
}
`

const BAD = `import type { Order } from './repository.ts'

type Repository = { insert(data: Omit<Order, 'id'>): Promise<Order> }
export type NewOrder = { customerId: string, totalCents: number, idempotencyKey: string }

export function createOrderService(repository: Repository) {
  const byKey = new Map<string, Order>()
  return {
    async createOrder({ customerId, totalCents, idempotencyKey }: NewOrder): Promise<Order> {
      const existing = byKey.get(idempotencyKey)
      if (existing) return existing
      const order = await repository.insert({ customerId, totalCents })
      byKey.set(idempotencyKey, order)
      return order
    },
  }
}
`

const task: Task = {
  id: 'idempotent-order',
  summary: 'a double click on Pay must not create two orders',
  prompt: "Ticket SHOP-158: customers who double click 'Pay' get two orders. The client already sends an idempotencyKey with each order. The same key must return the first order and never create a second one.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/orders/repository.ts': REPO,
    'src/orders/service.ts': SEED,
    'tests/service.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { createOrderRepository } from '../src/orders/repository.ts'
import { createOrderService } from '../src/orders/service.ts'

test('creates an order', async () => {
  const repository = createOrderRepository()
  const order = await createOrderService(repository).createOrder({ customerId: 'c1', totalCents: 500, idempotencyKey: 'k1' })
  assert.strictEqual(order.totalCents, 500)
  assert.strictEqual(repository.orders.length, 1)
})
`,
  },
  good: { 'src/orders/service.ts': GOOD },
  bad: { 'src/orders/service.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { createOrderRepository } = await load<{ createOrderRepository: () => { orders: object[] } }>(dir, 'src/orders/repository.ts')
    const { createOrderService } = await load<{ createOrderService: (repository: object) => { createOrder: (order: object) => Promise<{ id: string }> } }>(dir, 'src/orders/service.ts')
    const sequential = createOrderRepository()
    const service = createOrderService(sequential)
    const first = await service.createOrder({ customerId: 'c1', totalCents: 500, idempotencyKey: 'k1' })
    const again = await service.createOrder({ customerId: 'c1', totalCents: 500, idempotencyKey: 'k1' })
    expectEqual(failures, 'the same key returns the first order', again.id, first.id)
    await service.createOrder({ customerId: 'c1', totalCents: 500, idempotencyKey: 'k2' })
    expectEqual(failures, 'two keys create two orders', sequential.orders.length, 2)
    const concurrent = createOrderRepository()
    const doubleClick = createOrderService(concurrent)
    const order = { customerId: 'c2', totalCents: 900, idempotencyKey: 'k9' }
    const [a, b] = await Promise.all([doubleClick.createOrder(order), doubleClick.createOrder(order)])
    expectEqual(failures, 'a double click at the same time creates one order', concurrent.orders.length, 1)
    expectEqual(failures, 'both clicks get the same order', a.id, b.id)
    return failures
  },
}

export default task
