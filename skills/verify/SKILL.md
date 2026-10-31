---
name: verify
description: Memory is not a source. Research a fact that can change (version, image tag, API, flag, price, date) before you use it, and cite the source. The verify hook loads this skill in every session.
user-invocable: false
---

# Verify before you trust

Your memory is old. A fact that changes with time is false until a source proves it.

## When to research

Research before you write code, config, or a reply that contains one of these:

- a version or a tag: framework, library, runtime, Docker image, GitHub Action
- a package name, a flag of a CLI, an option of a config file
- an API or a config of a framework that has more than one version
- a price, a limit, a date, or the words "latest", "newest", "current", "recommended"

## How to research

Use the first source that answers, in this order:

1. The official documentation or the registry: Docker Hub, npm, PyPI, Packagist, crates.io, the release page of the project.
2. The documentation tool of the session, such as Context7.
3. The CLI of the project: `--help`, `npm view <package> version`, `docker manifest inspect <image:tag>`.
4. `WebSearch` or `WebFetch`, when the sources above do not answer.

Never read only one search result. If two sources disagree, trust the official one and say that they disagree.

## How to answer

- Put the source next to the fact: a link or the command that you ran.
- If you found no source, write "not verified". Never present the fact as certain.
- If the source shows that your memory was wrong, use the fact from the source.

## When not to research

- The repo already proves the fact: read the file or run the command.
- The subject is a stable concept that does not change with time.
- You already verified the same fact in this session.
