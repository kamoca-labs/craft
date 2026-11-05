# Implement the state of the art

The pattern that you remember can be old. Before you implement with a framework, a library, a Dockerfile, a CI pipeline, a tool config, or a security, accessibility, or performance setting, research the practice of today. A trivial change, or a change that follows a pattern of the repo, needs no research: follow the repo.

1. Research the official guide (syntax, versions, vendor practices) and the expert practice: official example repos, the linter of the subject (`hadolint`, `actionlint`), and the maintainers.
2. Apply what you found, not your memory. Cite each source next to the practice.
3. If the practice differs from the repo, show the difference with the source and ask the user which one to follow.
4. If you find no clear practice, write "not verified" and state your choice.

## Reuse before you build

Stop at the first step that answers:

1. The project: a function that is already in the repo.
2. A native feature of the language, the runtime, or the framework (`Intl`, `structuredClone`, `itertools`).
3. A vetted package: a dependency that is already installed, or a new one with a release in the last 12 months, real use, no known vulnerability (deps.dev, osv.dev), a clear license, and few dependencies.
4. Your own code, small and tested.

Name the step that answered in the reply.
