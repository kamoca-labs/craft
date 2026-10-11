import { CODE_FILE, deny, readInput, type HookInput } from '../lib.ts'

const TRANSLATION_FOLDER = /(^|\/)(lang|locales?|i18n|l10n|translations?)\//
const NON_ASCII_LETTER = /(?![\x00-\x7F])\p{L}/u

function addedText({ tool_input }: HookInput): string {
  const edits = tool_input.edits?.map((edit) => edit.new_string) || []
  return [tool_input.content, tool_input.new_string, ...edits].filter(Boolean).join('\n')
}

const input = readInput()
const file = input.tool_input.file_path || ''

if (CODE_FILE.test(file) && !TRANSLATION_FOLDER.test(file) && NON_ASCII_LETTER.test(addedText(input))) {
  deny('english-code', input)
}
