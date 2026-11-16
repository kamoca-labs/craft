import { addedText, deny, readActiveInput } from '../lib.ts'

type Layer = 'spec' | 'guide' | 'page' | 'other'

type Check = { layers: Layer[], pattern: RegExp, found: string }

const EVERY_LAYER: Layer[] = ['spec', 'guide', 'page', 'other']
const SPEC_OR_GUIDE: Layer[] = ['spec', 'guide']

const E2E_SCRIPT = /(^|\/)e2e\/.*\.(ts|mts|js|mjs)$/
const PAGE_OBJECT_FOLDER = /(^|\/)e2e\/(.*\/)?(pages|components)\//
const COMMENTS = /\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm

const CHECKS: Check[] = [
  { layers: EVERY_LAYER, pattern: /\bwaitForTimeout\s*\(/, found: 'waitForTimeout: wait for a condition with a web-first assert (toBeVisible, toHaveURL) or expect.poll' },
  { layers: EVERY_LAYER, pattern: /\bforce\s*:\s*true\b/, found: 'force: true: make the element ready for the user instead' },
  { layers: EVERY_LAYER, pattern: /\bmode\s*:\s*['"]serial['"]/, found: "mode: 'serial': make each test independent, or make the steps one test with test.step" },
  { layers: EVERY_LAYER, pattern: /expect\(\s*await\s+[^;\n]*?\.(isVisible|isHidden|isEnabled|isDisabled|isChecked|isEditable|textContent|innerText|innerHTML|inputValue|getAttribute|count)\s*\(/, found: 'a non-waiting assert: await expect(locator).toBeVisible() or toHaveCount() waits and retries' },
  { layers: SPEC_OR_GUIDE, pattern: /\.(getBy\w+|locator|frameLocator)\s*\(/, found: 'a locator in a spec or a guide: put it in the page object and use its member' },
  { layers: SPEC_OR_GUIDE, pattern: /\.(nth|first|last)\s*\(/, found: 'a position in a spec or a guide: add a method to the page object that finds the item by its business id' },
  { layers: SPEC_OR_GUIDE, pattern: /\bnew\s+[A-Z]\w*(Page|Component)\s*\(/, found: 'a page object built by hand: the fixture builds it, so ask for it in the test arguments' },
  { layers: SPEC_OR_GUIDE, pattern: /import\s+(?!type\b)[^;'"]*from\s+['"]@playwright\/test['"]|require\(\s*['"]@playwright\/test['"]/, found: "an import of test or expect from '@playwright/test': import them from e2e/fixtures" },
  { layers: SPEC_OR_GUIDE, pattern: /\.(route|routeFromHAR|unroute)\s*\(/, found: 'a stub of the network in a spec or a guide: the stubs of third parties live in a fixture' },
  { layers: ['spec'], pattern: /\.screencast\b/, found: 'page.screencast in a spec: a video for a manual goes in e2e/guides' },
  { layers: ['page'], pattern: /\.locator\(\s*['"`]|\.\$\$?\(|\.elementHandle\(|\.evaluateHandle\(/, found: 'a CSS or XPath locator or an element handle in a page object: use getByTestId' },
  { layers: ['page'], pattern: /\.(nth|first|last)\s*\(/, found: 'a position in a page object: find the item by its business id, as in rowFor(sku)' },
  { layers: ['page'], pattern: /\bclass\s+\w+(<[^>]*>)?\s+extends\b/, found: 'extends in a page object: compose a component object instead' },
  { layers: ['page'], pattern: /\.screencast\b/, found: 'page.screencast in a page object: a video for a manual goes in e2e/guides' },
]

function layerOf(file: string): Layer | null {
  if (!E2E_SCRIPT.test(file)) return null
  if (/\.spec\.\w+$/.test(file)) return 'spec'
  if (/\.guide\.\w+$/.test(file)) return 'guide'
  return PAGE_OBJECT_FOLDER.test(file) ? 'page' : 'other'
}

const input = readActiveInput()
const layer = layerOf(input.tool_input.file_path || '')

if (layer) {
  const code = addedText(input).replace(COMMENTS, '$1')
  const check = CHECKS.find(({ layers, pattern }) => layers.includes(layer) && pattern.test(code))
  if (check) deny('e2e-spec', input, check.found)
}
