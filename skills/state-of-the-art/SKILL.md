---
name: state-of-the-art
description: Before you implement, research the current best practice for the subject, reuse a native feature or a vetted package before own code, and cite the sources. The state-of-the-art hook loads this skill in every session.
user-invocable: false
---

# Implement the state of the art

You implement with the pattern that you remember. That pattern can be old. Before you implement, find out what is the best practice now.

## When it applies

Every request to implement or to create something that has a known good practice:

- code that uses a framework, a library, or a language feature
- a Dockerfile, a compose file, a CI pipeline, an infrastructure file
- a configuration of a tool (lint, build, test runner, web server)
- a security, an accessibility, or a performance setting

## When it does not apply

- A trivial change: a typo, a rename, a text change.
- A change that follows a pattern that the repo already sets. Follow the repo.

## Steps

1. **Name the subject.** Example: "Dockerfile for a Node API".
2. **Research the practice.** Follow `craft:verify` for the order of the sources. Look for all three:
   - **The official guide**: the syntax, the versions, and the best practices of the vendor.
   - **The expert practice**: how the maintainers and recognized practitioners organize the work. The official guide shows what is possible. The expert shows the layout, the conventions, and what never to do. Use these sources:
     - the official example repositories (for Docker, `docker/awesome-compose`)
     - the linter of the subject, because its rules encode the expert practice (`hadolint` for a Dockerfile, `actionlint` for GitHub Actions)
     - talks and posts of the maintainers
   - **The current discussion**: recent issues, release notes, and well-known guides.
3. **Apply what you found.** Use the practice, not your memory. Example for Docker: the official guide gives the syntax and the tag of the base image. The expert practice gives the organization: one Dockerfile per service, a multi-stage build, a `.dockerignore`, a user that is not root, a fixed tag, and no `hadolint` warning.
4. **Cite the sources.** Name each practice that you applied and put the link next to it.

## Reuse before you build

Before you write new code for a capability (parse, format, validate, retry, sort, hash, and so on), look for one that already exists. Stop at the first step that answers:

1. **The project.** Search the repo and the codebase map of the session. Reuse the function that is already there.
2. **A native feature.** Search the official docs of the language, the standard library, the runtime, and the framework of the project. Examples: `Intl.DateTimeFormat`, `structuredClone`, `Array.prototype.toSorted`, Python `itertools`, Go `slices`.
3. **A vetted package.** Use a package that is already a dependency first. Add a new one only if it passes all these checks. The checks come from the OpenSSF Concise Guide (https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software):
   - a release or significant activity in the last 12 months, and the package is not deprecated
   - significant use (downloads, dependents), and no similar name that is more popular (typosquatting)
   - no known important vulnerability in the version you add: check deps.dev, osv.dev, or the audit of the package manager
   - a good OpenSSF Scorecard on deps.dev, more than one maintainer when possible, and a stable API
   - a clear OSI license that fits the project
   - few indirect dependencies in production
4. **Your own code.** Write it only when no step above answers. Keep it small, with tests.

In the reply, name the step that answered. For a new package, give the evidence of each check with its source. If you skip a step, say why. Example: "the native `Intl` does not support this calendar".

## When the practice conflicts with the repo

If the current practice differs from the pattern that the repo uses, do not choose alone.

1. Say what differs and why the new practice is better, with the source.
2. Ask the user which one to follow.
3. Follow the answer.

## When you find no clear practice

Say "not verified" and state the choice that you made and the reason. Do not present a guess as a best practice.
