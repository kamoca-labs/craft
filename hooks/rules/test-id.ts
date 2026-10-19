import { addedText, deny, readInput, TEST_FILE } from '../lib.ts'

const COMPONENT_FILE = /\.(vue|jsx|tsx)$/
const OPENING_TAG = /<([A-Za-z][\w.-]*)((?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^>"'{])*)>/g
const INTERACTIVE_TAG = /^(button|a|input|select|textarea|form)$/
const EVENT_HANDLER = /(@|v-on:)(click|submit|change|input)\b|\bon(Click|Submit|Change|Input)\s*=/
const HIDDEN_INPUT = /\btype\s*=\s*["']hidden["']/
const TEST_ID = /\bdata-testid\b/
const FORWARDED_ATTRIBUTES = /v-bind\s*=\s*["']\$attrs["']|\{\s*\.\.\./

function isInteractive(tag: string, attributes: string): boolean {
  if (HIDDEN_INPUT.test(attributes)) return false
  return INTERACTIVE_TAG.test(tag) || EVENT_HANDLER.test(attributes)
}

function receivesTestId(attributes: string): boolean {
  return TEST_ID.test(attributes) || FORWARDED_ATTRIBUTES.test(attributes)
}

function missesTestId(text: string): boolean {
  return [...text.matchAll(OPENING_TAG)].some(([, tag, attributes]) => isInteractive(tag, attributes) && !receivesTestId(attributes))
}

const input = readInput()
const file = input.tool_input.file_path || ''

if (COMPONENT_FILE.test(file) && !TEST_FILE.test(file) && missesTestId(addedText(input))) {
  deny('test-id', input)
}
