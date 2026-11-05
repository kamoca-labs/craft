# English in the code

**Rule**: all code is in English: identifiers, comments, logs, internal exception messages and commits. The exception is the test file. The test name and the test data can be in the language of the project, because the test describes the behavior for the person who specified it. The test identifiers stay in English.

Text that the user sees is not code. It goes to the translation file (`i18n.md`).

## Why

- English is the common language of libraries, frameworks and the people who will maintain the code.
- Mixed languages force you to remember which term is in which language.

## Signs of violation

- A letter with an accent or from another alphabet in a code file outside the translation folder and outside the tests (the `english-code` hook already denies it).
- An identifier in a non-English language written without accents (for example `calcularPrecio`).
- A comment or a log in another language.

## How to apply

1. Write the identifier, the comment and the log in English.
2. If the text reaches the user, move it to the translation file (`i18n.md`).
3. Domain data that is content (city name, product name, database seed) is not code. It goes to data (JSON seed, CSV, database).

## Limits

- Legacy code in another language: do not translate it in bulk in the middle of a feature. What you touch comes out in English. The migration of the rest is a separate change.

## Verification question

Can a person who reads only English understand every name, comment and log in the change?
