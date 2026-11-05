import path from 'node:path'
import { expectNoThrow, expectThrows, load, PACKAGE_JSON, type Files, type Task } from '../task.ts'

const STORE = `export type Account = { id: number, email: string }

const accounts = new Map<string, Account>()

export function createAccount(email: string): Account {
  if (accounts.has(email)) throw new Error('email already in use')
  const account = { id: accounts.size + 1, email }
  accounts.set(email, account)
  return account
}

export function findAccount(email: string): Account | undefined {
  return accounts.get(email)
}

export function resetAccounts() {
  accounts.clear()
}
`

const LOGIN = `import { findAccount } from '../accounts/store.ts'

export function login(email: string): number {
  const account = findAccount(email)
  if (!account) throw new Error('unknown account')
  return account.id
}
`

const NORMALIZED = STORE
  .replace('export function createAccount(email: string): Account {\n', 'const key = (email: string) => email.trim().toLowerCase()\n\nexport function createAccount(email: string): Account {\n  email = key(email)\n')
  .replace('return accounts.get(email)', 'return accounts.get(key(email))')

function otherModules(): Files {
  const files: Files = {}
  for (let index = 1; index <= 11; index++) {
    files[`src/misc/module-${index}.ts`] = `export const value${index} = () => ${index}\n`
    files[`tests/module-${index}.test.ts`] = `import assert from 'node:assert'
import { test } from 'node:test'
import { value${index} } from '../src/misc/module-${index}.ts'

test('module ${index} returns its value', () => {
  assert.strictEqual(value${index}(), ${index})
})
`
  }
  return files
}

const task: Task = {
  id: 'email-duplicates',
  summary: 'one account per email, whatever the case or the spaces, also at login',
  heldOut: true,
  prompt: "Ticket ACC-12: customers create a second account with the same email in another case or with a space ('Ana@Shop.com' and ' ana@shop.com'). One email must have only one account.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/accounts/store.ts': STORE,
    'src/auth/login.ts': LOGIN,
    ...otherModules(),
    'tests/accounts.test.ts': `import assert from 'node:assert'
import { beforeEach, test } from 'node:test'
import { createAccount, resetAccounts } from '../src/accounts/store.ts'

beforeEach(() => resetAccounts())

test('the same email twice is rejected', () => {
  createAccount('ana@shop.com')
  assert.throws(() => createAccount('ana@shop.com'))
})
`,
  },
  good: { 'src/accounts/store.ts': NORMALIZED },
  bad: { 'src/accounts/store.ts': STORE.replace('if (accounts.has(email))', 'email = email.toLowerCase()\n  if (accounts.has(email))') },
  async check(dir) {
    const failures: string[] = []
    const { login } = await load<{ login: (email: string) => number }>(dir, 'src/auth/login.ts')
    const store = await import(path.join(dir, 'src/accounts/store.ts')) as { createAccount: (email: string) => unknown, resetAccounts?: () => void }
    store.resetAccounts?.()
    await expectNoThrow(failures, 'first account', () => store.createAccount('Ana@Shop.com'))
    await expectThrows(failures, 'same email in another case', () => store.createAccount('ana@shop.com'))
    await expectThrows(failures, 'same email with spaces', () => store.createAccount(' ANA@shop.com '))
    await expectNoThrow(failures, 'login in another case finds the account', () => login('ana@SHOP.com'))
    return failures
  },
}

export default task
