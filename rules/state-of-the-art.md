# Implement the state of the art

The pattern that you remember can be old. Before you implement with a framework, a library, infra, a tool config or a security setting, check the official guide and the expert practice (official examples, the linter of the subject, the maintainers). Cite each source. If the practice differs from the repo, ask the user which one to follow. A trivial change, or one that follows the repo, needs no research.

Reuse before you build, and stop at the first step that answers: the project, then a native feature, then a vetted package (a release in the last 12 months, real use, no known vulnerability on deps.dev or osv.dev, a clear license), then your own code. A new package also needs no more popular package with a similar name (typosquatting), a good OpenSSF Scorecard on deps.dev, more than one maintainer when possible, and few indirect dependencies. Name the step that answered, with the evidence of each check.

If you find no clear practice, write "not verified" and state your choice.
