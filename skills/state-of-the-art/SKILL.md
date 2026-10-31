---
name: state-of-the-art
description: Before you implement, research the current best practice and the recommendation of the community for the subject, apply it, and cite the sources. The state-of-the-art hook loads this skill in every session.
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
2. **Research the practice.** Follow `craft:verify` for the order of the sources. Look for both of these:
   - the official guide of best practices for the subject
   - the current recommendation of the community: the documentation of the maintainers, well-known guides, and recent discussions
3. **Apply what you found.** Use the practice, not your memory. Example for a Docker image: the official best-practices guide and the documentation of the base image. They give a multi-stage build, a user that is not root, a small base image, and a fixed tag.
4. **Cite the sources.** Name each practice that you applied and put the link next to it.

## When the practice conflicts with the repo

If the current practice differs from the pattern that the repo uses, do not choose alone.

1. Say what differs and why the new practice is better, with the source.
2. Ask the user which one to follow.
3. Follow the answer.

## When you find no clear practice

Say "not verified" and state the choice that you made and the reason. Do not present a guess as a best practice.
