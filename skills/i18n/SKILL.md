---
name: i18n
description: Code only in English, and user text through the internationalization of the stack. Use when an identifier, comment or log is in another language, when user-visible text (message, label, button, e-mail, validation error) is written directly in code in any language, when a date, number or currency is formatted by hand, or when the layout breaks with a long translation or with RTL.
argument-hint: "[file or scope]"
user-invocable: false
---

# English in the code, user language in the translation

**Rule**: all code is in English: identifiers, comments, logs, internal exception messages and commits. The exception is the test file. The test name and the test data can be in the language of the project, because the test describes the behavior for the person who specified it. The test identifiers stay in English. Text that the user sees is written in the native language of the user, but **never in the code**. It lives in the translation file, and the code references the key through the i18n of the stack.

## Why

- English is the common language of libraries, frameworks and the people who will maintain the code. Mixed languages force you to remember which term is in which language.
- Text in code spreads the same content over many files (`craft:dry`). Changing a sentence becomes a hunt through the project, and translating to another language becomes a rewrite.
- The people who own the text review the translation file without touching code, and the test checks the key instead of the sentence.

## Signs of violation

- A letter with an accent or from another alphabet in a code file outside the translation folder and outside the tests (the `english-code` hook already denies it).
- An identifier in a non-English language written without accents (for example `calcularPrecio`).
- A string literal that reaches the user: `throw new ValidationError('File too large')`, `<button>Save</button>`, `flash('Saved!')`, `'Hello ' + name`.
- A sentence built by concatenation, with the plural made by `if` (`count === 1 ? 'item' : 'items'`).
- A test that compares with the translated sentence instead of going through the translation.
- A date, number or currency formatted by hand: `` `${day}/${month}/${year}` ``, `'$' + price`, `value.toFixed(2)` on the screen.
- A fixed width on a text container: `width: 96px` on a button, `w-24` on a label.
- A physical direction property in CSS: `margin-left`, `padding-right`, `border-right`.

## How to apply

1. **Project without i18n**: propose the default library of the stack (table below), show the plan (dependency, folder, default language, first key) and **wait for the ok** before you install.
2. **Key**: in English, by domain and intent, not by the sentence (`attachment.tooLarge`, not `fileIsTooBig10mb`).
3. **Parameter**: values enter as a placeholder (`{max}`), never by concatenation. The plural follows the plural rule of the i18n.
4. **Translation file**: the sentence in the native language of the user (the default locale of the project, such as `en`). Only this file stays outside English code rules.
5. **Test**: verifies the key, or the sentence obtained by the same translation function, never the literal text.
6. **Outside the scope of i18n**: logs, exception messages that the user never sees, and developer text stay as literal English in the code.
7. **Format**: format date, number and currency with `Intl` (`Intl.DateTimeFormat`, `Intl.NumberFormat`) or with the i18n of the stack, using the locale of the user. Never format by hand.
8. **Room for translation**: the translated sentence can be 30 to 40% longer. The text container grows with the content (flex, grid, padding). Never give it a fixed width.
9. **RTL**: use the logical CSS properties (`margin-inline-start`, `padding-inline`, `border-inline-end`). Then the layout flips by itself in a right-to-left language.

| Stack | Library | Where the texts live |
|---|---|---|
| Laravel | native `__()` / `trans_choice()` | `lang/<locale>/*.php` or `lang/<locale>.json` |
| Vue | `vue-i18n` | `src/locales/<locale>.json` |
| React | `react-i18next` | `src/locales/<locale>.json` |
| Node (API) | `i18next` | `locales/<locale>.json` |
| Python | `gettext` / Django `gettext_lazy` | `locale/<locale>/LC_MESSAGES/*.po` |
| Go | `go-i18n` | `locales/<locale>.json` |
| Rust | `fluent` | `locales/<locale>/*.ftl` |

A project with its own i18n: use what already exists, without a library change.

## Example

```ts
// before
if (file.size > MAX_SIZE) {
  throw new ValidationError(`File larger than ${MAX_SIZE_MB} MB`)
}

// after
if (file.size > MAX_SIZE) {
  throw new ValidationError(t('attachment.tooLarge', { max: MAX_SIZE_MB }))
}
```

```json
// src/locales/en.json
{ "attachment": { "tooLarge": "File larger than {max} MB" } }
```

## Limits

- Domain data that is content (city name, product name, database seed) is not interface text. It goes to data (JSON seed, CSV, database), not to the translation file or to the code.
- Legacy code in another language: do not translate it in bulk in the middle of a feature. What you touch comes out in English. The migration of the rest is a separate change.

## Verification question

Does a change of the user language require edits only in translation files, and in no code file? With the new locale, do the date, number and currency change format, and does the layout stay intact?
