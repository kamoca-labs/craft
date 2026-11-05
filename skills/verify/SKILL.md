---
name: verify
description: Memory is not a source. Research a fact that can change (version, image tag, API, flag, price, date) before you use it, and cite the source. The verify hook loads this skill in every session.
user-invocable: false
disable-model-invocation: true
---

# Verify before you trust

Your memory is old. Before you write a version, a tag, a package name, a CLI flag, a config option, an API that changed between versions, a price, a limit, or the words "latest" or "recommended", find a source:

1. The official docs or the registry (npm, PyPI, Packagist, Docker Hub, the release page).
2. The documentation tool of the session, such as Context7.
3. The CLI: `--help`, `npm view <package> version`, `docker manifest inspect <image:tag>`.
4. `WebSearch` or `WebFetch`. Read more than one result.

Put the source next to the fact. Without a source, write "not verified". Do not research what the repo already proves, a stable concept, or a fact you already checked in this session.
