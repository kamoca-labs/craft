import { addedText, CODE_FILE, deny, readInput, TEST_FILE } from '../lib.ts'

const TRANSLATION_FOLDER = /(^|\/)(lang|locales?|i18n|l10n|translations?)\//
const NON_ASCII_LETTER = /(?![\x00-\x7F])\p{L}/u

const input = readInput()
const file = input.tool_input.file_path || ''

const isChecked = CODE_FILE.test(file) && !TRANSLATION_FOLDER.test(file) && !TEST_FILE.test(file)

if (isChecked && NON_ASCII_LETTER.test(addedText(input))) {
  deny('english-code', input)
}
