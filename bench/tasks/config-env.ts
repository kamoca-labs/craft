import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export type Config = { port: number, debug: boolean, databaseUrl: string }

export function loadConfig(env: Record<string, string | undefined>): Config {
  return {
    port: (env.PORT || 3000) as number,
    debug: Boolean(env.DEBUG),
    databaseUrl: env.DATABASE_URL || 'postgres://localhost/shop',
  }
}
`

const SERVER = `import { loadConfig } from './config.ts'

export function serverBanner(env: Record<string, string | undefined>): string {
  const config = loadConfig(env)
  return \`listening on \${config.port + 0}\${config.debug ? ' (debug)' : ''}\`
}
`

const GOOD = `export type Config = { port: number, debug: boolean, databaseUrl: string }

export function loadConfig(env: Record<string, string | undefined>): Config {
  return {
    port: Number(env.PORT || 3000),
    debug: ['true', '1'].includes((env.DEBUG ?? '').toLowerCase()),
    databaseUrl: env.DATABASE_URL || 'postgres://localhost/shop',
  }
}
`

const BAD = SEED.replace('(env.PORT || 3000) as number', 'Number(env.PORT || 3000)')

const task: Task = {
  id: 'config-env',
  summary: 'read PORT as a number and DEBUG=false as false',
  prompt: 'Ticket OPS-95: in production DEBUG=false turns the debug logs on, and the server banner shows the port 80800 when PORT=8080. Fix how the config reads the environment.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/config.ts': SEED,
    'src/server.ts': SERVER,
    'tests/config.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { loadConfig } from '../src/config.ts'

test('the default database is local', () => {
  assert.strictEqual(loadConfig({}).databaseUrl, 'postgres://localhost/shop')
})
`,
  },
  good: { 'src/config.ts': GOOD },
  bad: { 'src/config.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { loadConfig } = await load<{ loadConfig: (env: object) => { port: unknown, debug: unknown } }>(dir, 'src/config.ts')
    const { serverBanner } = await load<{ serverBanner: (env: object) => string }>(dir, 'src/server.ts')
    expectEqual(failures, 'PORT=8080 is the number 8080', loadConfig({ PORT: '8080' }).port, 8080)
    expectEqual(failures, 'no PORT is 3000', loadConfig({}).port, 3000)
    expectEqual(failures, 'the banner shows 8080', serverBanner({ PORT: '8080' }), 'listening on 8080')
    for (const value of ['false', '0', '', 'FALSE']) expectEqual(failures, `DEBUG=${JSON.stringify(value)} is off`, loadConfig({ DEBUG: value }).debug, false)
    for (const value of ['true', '1', 'TRUE']) expectEqual(failures, `DEBUG=${JSON.stringify(value)} is on`, loadConfig({ DEBUG: value }).debug, true)
    expectEqual(failures, 'no DEBUG is off', loadConfig({}).debug, false)
    return failures
  },
}

export default task
