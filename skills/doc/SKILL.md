---
name: doc
description: Writes ARCHITECTURE.md in the arc42 structure, one section at a time. Claude finds the facts in the repo and asks the user only the decisions, until all 12 sections are complete. Only the user calls it, with /craft:doc.
argument-hint: "[section number or name, or package path]"
disable-model-invocation: true
---

# Architecture documentation (arc42)

The result is one file, `ARCHITECTURE.md`, in the [arc42](https://arc42.org) structure (12 sections). Claude owns every fact. The user owns every decision. The skill ends when no section is open. It changes no code.

Read [the writing rules](../craft/references/ste.md) before you write the file.

## Rules

- **Facts are your work.** Find them in the repo (code, config, CI, `docs/`, `.claude/memory/`, git history). Never ask the user a fact that you can find.
- **Decisions are the user's work.** Goals, priorities, constraints, trade-offs, risks. Never choose one for the user.
- **Do not invent.** Write only what a source proves or what the user said. A missing answer stays open: mark the section `<!-- arc42:todo -->` and ask again in the next round.
- **Write less.** Document what a new team member needs to change the system safely. Skip a section part that has no content, and say so in one line. Do not copy what the code already shows.
- **Language.** The language of `ARCHITECTURE.md` follows the project ([discovery](references/discovery.md)). Your replies follow the language of the user.

## Steps

1. **Discover.** Read [the discovery rules](references/discovery.md). Find the language of the project and the layout (root or subdirectories). Tell the user both in one line. If a signal is unclear, ask one question and stop.
2. **Open the file.** Without `ARCHITECTURE.md`, create it from [the template](references/template.md), in the project language. With one, read it and continue from the sections that still have `<!-- arc42:todo -->`. A section without the marker is complete: never overwrite it unless the user asks to redo it.
3. **Pick the scope.** The argument can name one section (number or title) or a package path. Without an argument, go through sections 1 to 12 in order.
4. **Loop, one section at a time.** For the section in turn:
   1. Read its entry in [the section guide](references/sections.md). Read only that entry.
   2. Collect the facts from the repo. Fill the section with them, each one with its source (a path).
   3. List what only the user can decide. Send it as one round, in the format of [the round](../plan/references/round.md). Ask only the open decisions of this section. Then stop and wait.
   4. Write the answers in the section. Remove its `<!-- arc42:todo -->` marker only when the "done when" line of the guide is true.
   5. Go to the next section.
5. **Diagrams.** Use Mermaid in a fenced `mermaid` block, so the forge renders it. A table is better when the content is a list.
6. **Close.** Search the file for `<!-- arc42:todo -->`. If a marker remains, list the open sections and what each one needs. If none remains, check that every path in the file exists, show the section list with one line each, and ask the user to review the file.

The user can stop at any section. The markers keep the state, so the next `/craft:doc` continues from the first open section.
