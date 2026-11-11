# Filtered execution

The whole suite grows with the project and starts to cost minutes without telling you more about the change. Run only what the change can break:

| Step | What to run |
|---|---|
| 3 | only the test written in step 2 |
| 5 | the tests of the scenarios already done |
| 6 (between refactors) | the tests of the refactored file or module |
| 7 | the tests of the touched domains: the ones for the changed files (`git diff --name-only main...`) and the ones for the modules that import those files |

Run every test with a filter. The `filtered-tests` hook denies the full suite unless the push needs it. A small project, with 1 to 10 test files in git, can run its full suite: it takes seconds.

## When the full suite runs, and who decides

Nobody asks the user. Follow these cases in order, and stop at the first that applies:

1. **The project has no test.** There is nothing to run. Push.
2. **The project has CI.** The CI runs the full suite after the push. Running it locally would repeat the same work, so do not run it and do not ask.
3. **No CI, and no code changed since the last green run of the full suite** (or the commits to push have no code file, such as docs or config only). A run would prove nothing new. Do not run it and do not ask.
4. **No CI, tests exist, and code changed since the last green run.** Run the full suite now, without asking. Push only when it is green. The `push-gate` hook denies `git push`, `gh pr create` and `glab mr create` in this case, and the `filtered-tests` hook allows the unfiltered run.

"Code changed" is read from the commits that the push would send, compared with the upstream branch (or `origin/main`), and from the last code edit of the session. "Green run" is a successful run of the full suite after that last edit. A filtered run or a failed run does not count.

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
