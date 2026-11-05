---
name: filtered-tests
description: Run only the tests that the change can break, with a filter, and the full suite only in CI or with the consent of the user. Use in steps 3, 5, 6 and 7 of craft:atdd, when you choose a test filter for a runner, or when the filtered-tests or push-gate hook denies a command.
user-invocable: false
---

# Filtered execution

The whole suite grows with the project and starts to cost minutes without telling you more about the change. Run only what the change can break:

| Step | What to run |
|---|---|
| 3 | only the test written in step 2 |
| 5 | the tests of the scenarios already done |
| 6 (between refactors) | the tests of the refactored file or module |
| 7 | the tests of the touched domains: the ones for the changed files (`git diff --name-only main...`) and the ones for the modules that import those files |

Run every test with a filter. The `filtered-tests` hook denies the full suite without the consent of the user. A small project, with 1 to 10 test files in git, can run its full suite: it takes seconds.

The full suite runs this way:

- **Project with CI**: the full suite runs in the cloud, after the push. Do not run it locally.
- **Project without CI**: before the push or the PR/MR, ask the user with `AskUserQuestion`. Use the exact options `Run the full suite locally` and `Continue without the full suite`. The `push-gate` hook denies the push and the PR/MR until the user answers. If the answer is to run it, run the suite and push only with it green.

The answer is valid until the next code edit. After an edit, ask again.

When you report, state the filter used. Example: "Step 7 (Passing again): 34 passing in `tests/Feature/Request` and `tests/Unit/Attachment`".

Filters by runner:

| Runner | Filter |
|---|---|
| vitest | `vitest related <changed files> --run`, or `vitest run <folder>` |
| jest | `jest --findRelatedTests <changed files>`, or `jest <folder>` |
| pest / `artisan test` | `artisan test tests/Feature/<Domain>`, `--filter <name>` |
| phpunit | `phpunit tests/Unit/<Domain>`, `--filter <name>` |
| pytest | `pytest tests/<domain>`, `-k <name>` |
| `node --test` | `node --test <test files>`, `--test-name-pattern <name>` |
| go | `go test ./<package>/...`, `-run <name>` |
| cargo | `cargo test <name>`, `-p <crate>` |
| gradle / maven | `./gradlew test --tests <class>`, `mvn test -Dtest=<class>` |
| mocha | `mocha <test files>`, `--grep <name>` |
| unittest | `python -m unittest <module>` |
| rspec | `rspec <spec files>` |
