import { load, PACKAGE_JSON, type Task } from '../task.ts'

const I18N = `import { en } from './locales/en.ts'

const catalogs: Record<string, Record<string, string>> = { en }

export function t(key: string, locale = 'en'): string {
  return catalogs[locale]?.[key] ?? en[key as keyof typeof en] ?? key
}
`

const SIGNUP = `import { t } from '../i18n.ts'

export type SignupForm = { email?: string, password?: string, acceptedTerms?: boolean }

export function validateSignup(form: SignupForm, locale = 'en'): string[] {
  const errors: string[] = []
  if (!form.email) errors.push(t('signup.emailRequired', locale))
  if (!form.password || form.password.length < 8) errors.push('The password needs at least 8 characters.')
  if (!form.acceptedTerms) errors.push('You must accept the terms.')
  return errors
}
`

const EN = `export const en = {
  'signup.emailRequired': 'The email is required.',
}
`

const GOOD_EN = `export const en = {
  'signup.emailRequired': 'The email is required.',
  'signup.passwordTooShort': 'The password needs at least 8 characters.',
  'signup.termsRequired': 'You must accept the terms.',
}
`

const GOOD_ES = `export const es = {
  'signup.emailRequired': 'El correo es obligatorio.',
  'signup.passwordTooShort': 'La contrase\\u00f1a necesita al menos 8 caracteres.',
  'signup.termsRequired': 'Debes aceptar los t\\u00e9rminos.',
}
`

const ENGLISH = ['The email is required.', 'The password needs at least 8 characters.', 'You must accept the terms.']

const task: Task = {
  id: 'spanish-messages',
  summary: 'show the signup errors in Spanish',
  prompt: "Ticket WEB-77: we are opening in Mexico. When the user locale is 'es', the signup validation errors must show in Spanish. English stays the default.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/i18n.ts': I18N,
    'src/locales/en.ts': EN,
    'src/signup/validate.ts': SIGNUP,
    'tests/validate.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { validateSignup } from '../src/signup/validate.ts'

test('an empty form has three errors', () => {
  assert.strictEqual(validateSignup({}).length, 3)
})
`,
  },
  good: {
    'src/locales/en.ts': GOOD_EN,
    'src/locales/es.ts': GOOD_ES,
    'src/i18n.ts': I18N.replace("import { en } from './locales/en.ts'", "import { en } from './locales/en.ts'\nimport { es } from './locales/es.ts'").replace('= { en }', '= { en, es }'),
    'src/signup/validate.ts': SIGNUP.replace("'The password needs at least 8 characters.'", "t('signup.passwordTooShort', locale)").replace("'You must accept the terms.'", "t('signup.termsRequired', locale)"),
  },
  bad: {
    'src/locales/es.ts': "export const es = {\n  'signup.emailRequired': 'El correo es obligatorio.',\n}\n",
    'src/i18n.ts': I18N.replace("import { en } from './locales/en.ts'", "import { en } from './locales/en.ts'\nimport { es } from './locales/es.ts'").replace('= { en }', '= { en, es }'),
  },
  async check(dir) {
    const failures: string[] = []
    const { validateSignup } = await load<{ validateSignup: (form: object, locale?: string) => string[] }>(dir, 'src/signup/validate.ts')
    const spanish = validateSignup({}, 'es')
    if (spanish.length !== 3) failures.push(`es: expected 3 errors, got ${spanish.length}`)
    for (const message of spanish) {
      if (ENGLISH.includes(message)) failures.push(`es: the error is still in English: ${JSON.stringify(message)}`)
    }
    const english = validateSignup({})
    for (const message of ENGLISH) {
      if (!english.includes(message)) failures.push(`en: missing ${JSON.stringify(message)}`)
    }
    return failures
  },
}

export default task
