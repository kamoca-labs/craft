import fs from 'node:fs'
import path from 'node:path'
import { PACKAGE_JSON, type Task } from '../task.ts'

const BADGE = `const LABELS: Record<string, string> = { paid: 'Paid', open: 'Open', overdue: 'Overdue' }

export function statusBadge(status: string): string {
  return \`<span class="badge badge--\${status}">\${LABELS[status] ?? status}</span>\`
}
`

const CSS = `.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge--paid {
  background: #2e7d32;
  color: #fff;
}

.badge--open {
  background: #1565c0;
  color: #fff;
}

.badge--overdue {
  background: #9e9e9e;
  color: #212121;
}
`

const GOOD_CSS = CSS.replace(`.badge--overdue {
  background: #9e9e9e;
  color: #212121;
}`, `.badge--overdue {
  background: #c62828;
  color: #fff;
  white-space: nowrap;
}`)

function rules(css: string): { selector: string, body: string }[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)].map((match) => ({ selector: match[1].trim(), body: match[2].toLowerCase() }))
}

const task: Task = {
  id: 'overdue-badge',
  summary: 'make the overdue badge red, with a label that never wraps',
  prompt: 'Ticket UI-58: on the invoice list the "Overdue" badge is grey, so customers miss it. Make it red (#c62828) with white text. In the narrow column the label wraps to two lines, and it must stay on one line.',
  seed: {
    'package.json': PACKAGE_JSON,
    'src/components/status-badge.ts': BADGE,
    'src/components/status-badge.css': CSS,
    'tests/status-badge.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { statusBadge } from '../src/components/status-badge.ts'

test('the badge shows the label of the status', () => {
  assert.match(statusBadge('paid'), />Paid</)
})
`,
  },
  good: { 'src/components/status-badge.css': GOOD_CSS },
  bad: { 'src/components/status-badge.css': CSS.replace('background: #9e9e9e;', 'background: #c62828;') },
  async check(dir) {
    const failures: string[] = []
    const css = fs.readFileSync(path.join(dir, 'src/components/status-badge.css'), 'utf8')
    const overdue = rules(css).filter((rule) => /\.badge--overdue\b/.test(rule.selector)).map((rule) => rule.body).join('\n')
    const badge = rules(css).filter((rule) => /\.badge(--overdue)?\b(?!-)/.test(rule.selector)).map((rule) => rule.body).join('\n')
    if (!/background(-color)?\s*:\s*#c62828/.test(overdue)) failures.push('the overdue badge is not #c62828')
    if (!/(^|[^-])color\s*:\s*(#fff\b|#ffffff\b|white\b)/.test(overdue)) failures.push('the overdue text is not white')
    if (!/white-space\s*:\s*nowrap/.test(badge)) failures.push('the label can still wrap')
    return failures
  },
}

export default task
