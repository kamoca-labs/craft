import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export class HttpError extends Error {
  status: number
  constructor(status: number) {
    super(\`HTTP \${status}\`)
    this.status = status
  }
}

export async function getJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const response = await fetchImpl(url)
  if (!response.ok) throw new HttpError(response.status)
  return response.json()
}
`

const PAYMENTS = `import { getJson } from '../http/client.ts'

export function paymentStatus(paymentId: string, fetchImpl?: typeof fetch) {
  return getJson(\`https://pay.example.com/payments/\${paymentId}\`, fetchImpl)
}
`

const GOOD = SEED.replace(`export async function getJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const response = await fetchImpl(url)
  if (!response.ok) throw new HttpError(response.status)
  return response.json()
}`, `const ATTEMPTS = 3

export async function getJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetchImpl(url)
    if (response.ok) return response.json()
    if (response.status !== 503 || attempt === ATTEMPTS) throw new HttpError(response.status)
    await new Promise((resolve) => setTimeout(resolve, 200 * attempt))
  }
}`)

const BAD = SEED.replace(`export async function getJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const response = await fetchImpl(url)
  if (!response.ok) throw new HttpError(response.status)
  return response.json()
}`, `export async function getJson(url: string, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetchImpl(url)
    if (response.ok) return response.json()
    if (attempt === 3) throw new HttpError(response.status)
  }
}`)

function fakeFetch(statuses: number[]) {
  const calls: string[] = []
  const fetchImpl = async (url: string) => {
    calls.push(url)
    const status = statuses[Math.min(calls.length - 1, statuses.length - 1)]
    return new Response(JSON.stringify({ status: 'paid' }), { status })
  }
  return { calls, fetchImpl }
}

const task: Task = {
  id: 'retry-unavailable',
  summary: 'retry the payment provider while it is unavailable, and only then',
  prompt: 'Ticket PAY-19: during deploys the payment provider answers 503 Service Unavailable for a few seconds, and our checkout fails. Retry the call while the provider is unavailable.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/http/client.ts': SEED,
    'src/payments/status.ts': PAYMENTS,
    'tests/client.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { getJson, HttpError } from '../src/http/client.ts'

test('returns the JSON body', async () => {
  const fetchImpl = async () => new Response('{"ok":true}', { status: 200 })
  assert.deepStrictEqual(await getJson('https://x', fetchImpl as typeof fetch), { ok: true })
})

test('throws an HttpError with the status', async () => {
  const fetchImpl = async () => new Response('', { status: 404 })
  await assert.rejects(getJson('https://x', fetchImpl as typeof fetch), HttpError)
})
`,
  },
  good: { 'src/http/client.ts': GOOD },
  bad: { 'src/http/client.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const realTimeout = globalThis.setTimeout
    globalThis.setTimeout = ((callback: () => void) => realTimeout(callback, 0)) as typeof setTimeout
    const { paymentStatus } = await load<{ paymentStatus: (id: string, fetchImpl: unknown) => Promise<unknown> }>(dir, 'src/payments/status.ts')
    const recovers = fakeFetch([503, 503, 200])
    try {
      expectEqual(failures, '503, 503, then 200 returns the body', await paymentStatus('p1', recovers.fetchImpl), { status: 'paid' })
    } catch (error) {
      failures.push(`503, 503, then 200: unexpected error ${(error as Error).message}`)
    }
    const notFound = fakeFetch([404])
    await paymentStatus('p2', notFound.fetchImpl).catch(() => undefined)
    expectEqual(failures, 'a 404 is not retried (calls)', notFound.calls.length, 1)
    const down = fakeFetch([503])
    const failed = await paymentStatus('p3', down.fetchImpl).then(() => false, () => true)
    expectEqual(failures, 'a provider that stays down still fails', failed, true)
    if (down.calls.length < 2 || down.calls.length > 6) failures.push(`a provider that stays down: expected 2 to 6 calls, got ${down.calls.length}`)
    globalThis.setTimeout = realTimeout
    return failures
  },
}

export default task
